package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import com.oblapleon.bidapi.common.exceptions.ConflictException
import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.common.security.Hashing
import com.oblapleon.bidapi.feature.auction.repo.AuctionRepo
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.UpdateUserReqDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserService(
    private val userRepo: UserRepo,
    private val hashing: Hashing,
    private val auctionRepo: AuctionRepo
) {

    @Transactional(readOnly = true)
    fun findById(id: Long): User =
        userRepo.findById(id).orElseThrow { NotFoundException("User with ID $id not found") }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<User> = userRepo.findAll(pageable)

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
            if (!hashing.checkBcrypt(password, initiator.password)) {
                throw UnauthorizedException("Incorrect password.")
            }
        }
        softDeleteUser(targetUser)
    }

    private fun softDeleteUser(user: User) {
        val userId = user.id ?: return
        if (auctionRepo.hasActiveAuctionsWithBids(userId)) {
            throw ConflictException(
                "Cannot delete account. You have active auctions with existing bids. " +
                        "Please wait for auctions to conclude or contact support."
            )
        }
        auctionRepo.cancelAllActiveAuctionsByUserId(userId)
        user.deletedAt = LocalDateTime.now()
        userRepo.save(user)
    }

    fun restoreUser(payload: LoginReqDto) {
        val user = userRepo.findByUsername(payload.username)
            ?: throw UnauthorizedException("Invalid credentials.")

        if (!hashing.checkBcrypt(payload.password, user.password)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        if (user.deletedAt == null) throw BadRequestException("Account is already active.")

        user.deletedAt = null
        userRepo.save(user)
    }

    fun updateUser(id: Long, request: UpdateUserReqDto, isSelfUpdate: Boolean): User {
        val user = findById(id)

        request.username?.let { newName ->
            if (newName != user.username) {
                validateUniqueUsername(newName)
                user.username = newName
            }
        }

        request.email?.let { newEmail ->
            if (newEmail != user.email) {
                validateUniqueEmail(newEmail)
                user.email = newEmail
            }
        }

        if (!isSelfUpdate && request.password != null) {
            validatePassword(request.password)
            user.password = hashing.hashBcrypt(request.password)
        }

        return userRepo.save(user)
    }

    fun changePassword(id: Long, oldPass: String, newPass: String) {
        val user = findById(id)
        if (!hashing.checkBcrypt(oldPass, user.password)) {
            throw BadRequestException("Old password is incorrect")
        }
        validatePassword(newPass)
        user.password = hashing.hashBcrypt(newPass)
        userRepo.save(user)
    }

    @Transactional(readOnly = true)
    fun searchByUsername(query: String, pageable: Pageable) =
        userRepo.findByUsernameContainingIgnoreCase(query, pageable)

    @Transactional(readOnly = true)
    fun searchByEmail(query: String, pageable: Pageable) =
        userRepo.findByEmailContainingIgnoreCase(query, pageable)

    // Helpers
    @Transactional(readOnly = true)
    fun findByName(username: String): User =
        userRepo.findByUsername(username) ?: throw NotFoundException("User '$username' not found")

    @Transactional(readOnly = true)
    fun existsByName(username: String) = userRepo.existsByUsername(username)

    @Transactional(readOnly = true)
    fun existsByEmail(email: String) = userRepo.existsByEmail(email)

    private fun validateUniqueUsername(username: String) {
        if (existsByName(username)) throw ConflictException("Username '$username' is already taken")
    }

    private fun validateUniqueEmail(email: String) {
        if (existsByEmail(email)) throw ConflictException("Email '$email' is already registered")
    }

    private fun validatePassword(password: String) {
        if (password.length < 6) {
            throw BadRequestException("Password must be at least 6 characters long")
        }
    }
}