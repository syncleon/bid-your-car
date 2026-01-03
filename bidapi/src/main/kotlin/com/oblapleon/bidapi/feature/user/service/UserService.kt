package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.common.exceptions.ConflictException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.common.service.BaseService
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.UserUpdateRequest
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Service class responsible for managing User entities.
 * Handles CRUD operations, profile updates, password management,
 * and the soft-deletion/restoration lifecycle.
 */
@Service
@Transactional
class UserService(
    private val userRepo: UserRepo,
    private val passwordService: PasswordService
) : BaseService<User, Long> {

    /**
     * Retrieves a user by their unique ID.
     *
     * @param id The ID of the user to retrieve.
     * @return The found User entity.
     * @throws NotFoundException If no user is found with the given ID.
     */
    override fun findById(id: Long): User =
        userRepo.findById(id)
            .orElseThrow { NotFoundException("User with ID $id not found") }

    /**
     * Retrieves all users in the system.
     *
     * @return A list of all User entities.
     */
    override fun findAll(): List<User> =
        userRepo.findAll()

    /**
     * Performs a standard soft delete on a user by ID.
     * This method bypasses password checks and is intended for internal administrative use.
     *
     * @param id The ID of the user to delete.
     * @throws NotFoundException If the user does not exist.
     */
    override fun delete(id: Long) {
        val user = findById(id)
        softDeleteUser(user)
    }

    /**
     * Performs a secure soft delete of a user account.
     * If the initiator is deleting their own account, a password verification is required.
     * Admins can delete any account without password verification.
     *
     * @param initiator The user performing the action.
     * @param targetUserId The ID of the user to be deleted.
     * @param password The password of the initiator (required only for self-deletion).
     * @throws UnauthorizedException If the initiator lacks permissions or provides an incorrect password.
     * @throws BadRequestException If the password is missing during a self-deletion attempt.
     */
    fun deleteWithVerification(initiator: User, targetUserId: Long, password: String?) {
        val targetUser = findById(targetUserId)
        val isSelfDelete = (initiator.id == targetUserId)
        val isAdmin = initiator.roles.any { it.name == ERole.ADMIN }

        if (!isSelfDelete && !isAdmin) {
            throw UnauthorizedException("You are not authorized to delete this user.")
        }

        if (isSelfDelete) {
            if (password.isNullOrBlank()) {
                throw BadRequestException("Current password is required to delete your account.")
            }
            if (!passwordService.matches(password, initiator.password)) {
                throw UnauthorizedException("Incorrect password. Account deletion failed.")
            }
        }

        softDeleteUser(targetUser)
    }

    private fun softDeleteUser(user: User) {
        user.deletedAt = LocalDateTime.now()
        userRepo.save(user)
    }

    /**
     * Restores a previously soft-deleted account.
     * Requires valid login credentials to prove ownership before reactivation.
     *
     * @param payload The login credentials (username and password) of the account to restore.
     * @throws UnauthorizedException If the credentials are invalid or do not match.
     * @throws BadRequestException If the account is already active (not deleted).
     */
    fun restoreUser(payload: LoginReqDto) {
        val user = userRepo.findByUsername(payload.username)
            ?: throw UnauthorizedException("Invalid credentials.")

        if (!passwordService.matches(payload.password, user.password!!)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        if (user.deletedAt == null) {
            throw BadRequestException("Account is already active.")
        }

        user.deletedAt = null
        userRepo.save(user)
    }

    /**
     * Permanently removes a user from the database (Hard Delete).
     * This action is irreversible and typically used by background cleanup jobs.
     *
     * @param id The ID of the user to permanently delete.
     * @throws NotFoundException If the user does not exist.
     */
    fun deletePermanently(id: Long) {
        if (!userRepo.existsById(id)) throw NotFoundException("User $id not found")
        userRepo.deleteById(id)
    }

    /**
     * Finds users who have been soft-deleted before a specific cutoff date.
     * Used to identify accounts eligible for permanent purging.
     *
     * @param cutoffDate The date and time threshold for deletion.
     * @return A list of users deleted before the cutoff date.
     */
    fun findReadyForPurge(cutoffDate: LocalDateTime): List<User> {
        return userRepo.findAllByDeletedAtBefore(cutoffDate)
    }

    /**
     * Finds a user by their username.
     *
     * @param username The username to search for.
     * @return The found User entity.
     * @throws NotFoundException If no user exists with the given username.
     */
    fun findByName(username: String): User =
        userRepo.findByUsername(username)
            ?: throw NotFoundException("User '$username' not found")

    /**
     * Finds a user by their email address.
     *
     * @param email The email to search for.
     * @return The found User entity.
     * @throws NotFoundException If no user exists with the given email.
     */
    fun findByEmail(email: String): User =
        userRepo.findByEmail(email)
            ?: throw NotFoundException("User '$email' not found")

    /**
     * Checks if a username is already in use.
     *
     * @param username The username to check.
     * @return True if the username exists, false otherwise.
     */
    fun existsByName(username: String): Boolean = userRepo.existsByUsername(username)

    /**
     * Checks if an email address is already in use.
     *
     * @param email The email to check.
     * @return True if the email exists, false otherwise.
     */
    fun existsByEmail(email: String): Boolean = userRepo.existsByEmail(email)

    /**
     * Saves or updates a user entity in the database.
     *
     * @param user The user entity to save.
     * @return The saved user entity.
     */
    fun save(user: User): User = userRepo.save(user)

    /**
     * Returns the total count of users in the system.
     *
     * @return The number of user records.
     */
    fun countAll(): Long = userRepo.count()

    /**
     * Updates the authenticated user's profile information.
     * Checks for unique constraints on username and email before updating.
     *
     * @param id The ID of the user to update.
     * @param username The new username (optional).
     * @param email The new email (optional).
     * @return The updated User entity.
     * @throws ConflictException If the new username or email is already taken by another user.
     */
    fun updateProfile(id: Long, username: String?, email: String?): User {
        val user = findById(id)

        username?.let {
            if (it != user.username && existsByName(it)) {
                throw ConflictException("Username '$it' is already taken")
            }
            user.username = it
        }
        email?.let {
            if (it != user.email && existsByEmail(it)) {
                throw ConflictException("Email '$it' is already registered")
            }
            user.email = it
        }
        return userRepo.save(user)
    }

    /**
     * Updates a user's password.
     * Requires the old password to be verified before setting the new one.
     *
     * @param id The ID of the user.
     * @param oldPassword The current password of the user.
     * @param newPassword The new password to set.
     * @throws BadRequestException If the old password provided does not match the stored password.
     */
    fun changePassword(id: Long, oldPassword: String, newPassword: String) {
        val user = findById(id)
        if (!passwordService.matches(oldPassword, user.password)) {
            throw BadRequestException("Old password is incorrect")
        }
        user.password = passwordService.encode(newPassword)
        userRepo.save(user)
    }

    /**
     * Updates user details based on an administrative request.
     * This method can update username, email, and password without requiring old password verification.
     *
     * @param id The ID of the user to update.
     * @param request The update request containing new details.
     * @return The updated User entity.
     * @throws ConflictException If the new username or email is already taken.
     */
    fun update(id: Long, request: UserUpdateRequest): User {
        val user = findById(id)

        request.username?.let {
            if (it != user.username && existsByName(it)) throw ConflictException("Username taken")
            user.username = it
        }
        request.email?.let {
            if (it != user.email && existsByEmail(it)) throw ConflictException("Email taken")
            user.email = it
        }
        request.password?.let { user.password = passwordService.encode(it) }

        return userRepo.save(user)
    }

    /**
     * Searches for users whose username contains the given query string (case-insensitive).
     *
     * @param query The partial username to search for.
     * @return A list of matching users.
     */
    fun searchByUsernameContains(query: String) = userRepo.findByUsernameContainingIgnoreCase(query)

    /**
     * Searches for users whose email contains the given query string (case-insensitive).
     *
     * @param query The partial email to search for.
     * @return A list of matching users.
     */
    fun searchByEmailContains(query: String) = userRepo.findByEmailContainingIgnoreCase(query)

    /**
     * Retrieves a list of users corresponding to the provided set of IDs.
     *
     * @param ids A set of user IDs to retrieve.
     * @return A list of found User entities.
     */
    fun findByIds(ids: Set<Long>) = userRepo.findAllById(ids).toList()
}