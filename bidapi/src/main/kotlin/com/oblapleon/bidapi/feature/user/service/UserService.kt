package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.repository.BidRepository // <-- Добавлен импорт
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.UpdatePasswordReqDto
import com.oblapleon.bidapi.feature.user.dto.UpdateUserReqDto
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import com.oblapleon.bidapi.common.service.StorageService
import java.time.Instant
import java.util.Optional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val auctionRepository: AuctionRepository,
    private val bidRepository: BidRepository,
    private val passwordEncoder: PasswordEncoder,
    private val storageService: StorageService
) {

    fun findById(id: Long): User = userRepository.findById(id).orElseThrow { NotFoundException("User not found") }
    fun findByUsername(username: String): Optional<User> = userRepository.findByUsername(username)
    fun findAll(pageable: Pageable): Page<User> = userRepository.findAll(pageable)
    fun searchByUsername(query: String, pageable: Pageable) = userRepository.findByUsernameContainingIgnoreCase(query, pageable)
    fun searchByEmail(query: String, pageable: Pageable) = userRepository.findByEmailContainingIgnoreCase(query, pageable)
    fun existsByName(username: String) = userRepository.existsByUsername(username)
    fun existsByEmail(email: String) = userRepository.existsByEmail(email)

    @Transactional
    fun updateUser(id: Long, request: UpdateUserReqDto, isSelfUpdate: Boolean): User {
        val user = findById(id)

        val changingUsername = request.username != null && request.username != user.username
        val changingEmail = request.email != null && request.email != user.email

        if (changingUsername || changingEmail) {
            if (bidRepository.countActiveBidsByBidderId(id) > 0) {
                throw ConflictException("Cannot update profile: You have active bids on ongoing auctions.")
            }

            // 2. Блокируем изменение, если у пользователя есть собственные активные аукционы
            if (auctionRepository.existsActiveAuctionsBySellerId(id)) {
                throw ConflictException("Cannot update profile: You have active auction listings.")
            }
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

    @Transactional
    fun deleteMyAccount(userId: Long, passwordConfirmation: String) {
        val user = findById(userId)
        if (!passwordEncoder.matches(passwordConfirmation, user.password)) {
            throw UnauthorizedException("Incorrect password")
        }
        performSoftDelete(user)
    }

    @Transactional
    fun adminDeactivateUser(targetUserId: Long) {
        val user = findById(targetUserId)
        performSoftDelete(user)
    }

    private fun performSoftDelete(user: User) {
        val userId = user.id!!

        if (auctionRepository.existsBySellerIdAndStatusAndBidsIsNotEmpty(userId)) {
            throw ConflictException("Cannot delete account: You have active auctions with bids.")
        }

        if (bidRepository.countActiveBidsByBidderId(userId) > 0) {
            throw ConflictException("Cannot delete account: You have active bids on ongoing auctions. Please wait until they finish.")
        }

        auctionRepository.cancelAllActiveAuctionsBySellerId(userId)
        user.deletedAt = Instant.now()
        userRepository.save(user)
    }

    @Transactional
    fun restoreUser(payload: LoginReqDto) {
        val safeUsername = payload.username
        val safePassword = payload.password

        val user = userRepository.findAnyByUsername(safeUsername)
            ?: throw UnauthorizedException("User not found or credentials invalid.")

        if (!passwordEncoder.matches(safePassword, user.password)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        if (user.deletedAt == null) {
            throw BadRequestException("Account is already active.")
        }

        user.deletedAt = null
        userRepository.save(user)
    }

    @Transactional
    fun uploadProfilePhoto(userId: Long, file: MultipartFile): User {
        val user = findById(userId)
        
        // Optional: delete old photo if exists to save space (would need full URL -> Key logic)
        // user.profilePhotoUrl?.let { storageService.deleteFile(it) }

        val imageUrl = storageService.uploadFile(file)
        user.profilePhotoUrl = imageUrl
        return userRepository.save(user)
    }
}