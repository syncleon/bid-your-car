package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
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
import java.time.Instant
import java.util.Optional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val auctionRepository: AuctionRepository,
    private val passwordEncoder: PasswordEncoder
) {

    // ... Read Operations (Same as before) ...
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
        auctionRepository.cancelAllActiveAuctionsBySellerId(userId)
        user.deletedAt = Instant.now()
        userRepository.save(user)
    }

    @Transactional
    fun restoreUser(payload: LoginReqDto) {
        val safeUsername = payload.username
        val safePassword = payload.password

        // 1. Use the native query to find the user even if they are soft-deleted
        val user = userRepository.findAnyByUsername(safeUsername)
            ?: throw UnauthorizedException("User not found or credentials invalid.")

        // 2. Verify password
        if (!passwordEncoder.matches(safePassword, user.password)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        // 3. Ensure they are actually deleted
        if (user.deletedAt == null) {
            throw BadRequestException("Account is already active.")
        }

        // 4. Restore them
        user.deletedAt = null
        userRepository.save(user)
    }
}