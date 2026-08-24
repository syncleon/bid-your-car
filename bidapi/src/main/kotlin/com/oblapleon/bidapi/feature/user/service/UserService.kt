package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.common.event.UserDeletionRequestedEvent
import com.oblapleon.bidapi.common.event.UserUpdateRequestedEvent
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.UpdatePasswordReqDto
import com.oblapleon.bidapi.feature.user.dto.UpdateUserReqDto
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import com.oblapleon.bidapi.common.service.StorageService
import java.time.Instant
import java.util.Optional
import java.util.UUID

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val storageService: StorageService,
    private val eventPublisher: ApplicationEventPublisher

) {

    /** Retrieves a user by ID or throws NotFoundException. */
    fun findById(id: Long): User = userRepository.findById(id).orElseThrow { NotFoundException("User not found") }

    /** Retrieves an optional user by username. */
    fun findByUsername(username: String): Optional<User> = userRepository.findByUsername(username)

    /** Retrieves a paginated list of all users. */
    fun findAll(pageable: Pageable): Page<User> = userRepository.findAll(pageable)

    /** Searches for users by username containing the given query string. */
    fun searchByUsername(query: String, pageable: Pageable) = userRepository.findByUsernameContainingIgnoreCase(query, pageable)

    /** Searches for users by email containing the given query string. */
    fun searchByEmail(query: String, pageable: Pageable) = userRepository.findByEmailContainingIgnoreCase(query, pageable)

    /** Checks if a username is already taken. */
    fun existsByName(username: String) = userRepository.existsByUsername(username)

    /** Checks if an email is already taken. */
    fun existsByEmail(email: String) = userRepository.existsByEmail(email)

    /**
     * Updates user profile information.
     * Prevents critical updates (username, email) if the user has active bids or auctions.
     *
     * @param id The ID of the user.
     * @param request The update request containing new details.
     * @param isSelfUpdate Indicates if the user is updating their own profile (true) or an admin is doing it (false).
     * @return The updated [User].
     * @throws ConflictException if username/email is taken or active bids/auctions block the update.
     */
    @Transactional
    fun updateUser(id: Long, request: UpdateUserReqDto, isSelfUpdate: Boolean): User {
        val user = findById(id)

        val changingUsername = request.username != null && request.username != user.username
        val changingEmail = request.email != null && request.email != user.email

        if (changingUsername || changingEmail) {
            eventPublisher.publishEvent(UserUpdateRequestedEvent(id))
        }

        request.username?.let { newName ->
            if (newName != user.username) {
                if (existsByName(newName)) throw ConflictException("Username taken")
                user.username = newName
            }
        }
        request.email?.let { newEmail ->
            if (newEmail != user.email) {
                if (existsByEmail(newEmail)) throw ConflictException("Email taken")
                user.email = newEmail
            }
        }
        if (request.bio != null) {
            user.bio = request.bio
        }
        if (!isSelfUpdate && request.password != null) {
            if (request.password.length < 6) throw BadRequestException("Password too short")
            user.password = passwordEncoder.encode(request.password)
        }
        return userRepository.save(user)
    }

    /**
     * Changes the password for a user.
     *
     * @param userId The ID of the user.
     * @param request The password update request containing old and new passwords.
     * @throws BadRequestException if the old password is incorrect or the new one is too short.
     */
    @Transactional
    fun changePassword(userId: Long, request: UpdatePasswordReqDto) {
        val user = findById(userId)
        if (!passwordEncoder.matches(request.oldPassword, user.password)) {
            throw BadRequestException("Current password is incorrect")
        }
        if (request.newPassword.length < 6) throw BadRequestException("Password too short")
        user.password = passwordEncoder.encode(request.newPassword)
        userRepository.save(user)
    }

    /**
     * Soft deletes the current user's account.
     * Requires password confirmation.
     *
     * @param userId The ID of the user deleting their account.
     * @param passwordConfirmation The user's password.
     * @throws UnauthorizedException if the password is incorrect.
     */
    @Transactional
    fun deleteMyAccount(userId: Long, passwordConfirmation: String) {
        val user = findById(userId)
        if (!passwordEncoder.matches(passwordConfirmation, user.password)) {
            throw UnauthorizedException("Incorrect password")
        }
        performSoftDelete(user)
    }

    /**
     * Soft deletes a user account (Admin action).
     *
     * @param targetUserId The ID of the user to deactivate.
     */
    @Transactional
    fun adminDeactivateUser(targetUserId: Long) {
        val user = findById(targetUserId)
        performSoftDelete(user)
    }

    /**
     * Performs the actual soft delete logic for a user.
     * Cancels any active auctions without bids.
     *
     * @param user The [User] to delete.
     * @throws ConflictException if the user has active bids or active auctions with bids.
     */
    private fun performSoftDelete(user: User) {
        val userId = user.id!!

        eventPublisher.publishEvent(UserDeletionRequestedEvent(user))
        user.deletedAt = Instant.now()
        
        // Scramble username and email to comply with GDPR and free up unique constraints
        val suffix = UUID.randomUUID().toString().take(8)
        user.username = "deleted_${suffix}_${user.username}"
        user.email = "deleted_${suffix}_${user.email}"
        
        userRepository.save(user)
    }

    /**
     * Restores a soft-deleted user account using their login credentials.
     *
     * @param payload The login request containing username and password.
     * @throws UnauthorizedException if credentials don't match.
     * @throws BadRequestException if the account is already active.
     */
    @Transactional
    fun restoreUser(payload: LoginReqDto) {
        val safeUsername = payload.username
        val safePassword = payload.password

        val deletedAt = userRepository.findDeletedAtByUsername(safeUsername!!)
        if (deletedAt == null) {
            // Verify if user exists at all and is active
            if (userRepository.findByUsername(safeUsername).isPresent) {
                 throw BadRequestException("Account is already active.")
            }
            throw UnauthorizedException("User not found or credentials invalid.")
        }

        val storedPassword = userRepository.findPasswordByUsername(safeUsername)
            ?: throw UnauthorizedException("User not found or credentials invalid.")

        if (!passwordEncoder.matches(safePassword, storedPassword)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        userRepository.restoreUserByUsername(safeUsername)
    }

    /**
     * Uploads and sets a new profile photo for the user.
     *
     * @param userId The ID of the user.
     * @param file The image file.
     * @return The updated [User].
     */
    @Transactional
    fun uploadProfilePhoto(userId: Long, file: MultipartFile): User {
        val user = findById(userId)
        
        // Delete old photo if it exists to prevent storage leaks
        user.profilePhotoUrl?.let { 
            try {
                storageService.deleteFile(it) 
            } catch (e: Exception) {
                // Log and swallow so upload doesn't fail if old file is missing
            }
        }

        val imageUrl = storageService.uploadFile(file)
        user.profilePhotoUrl = imageUrl
        return userRepository.save(user)
    }
}