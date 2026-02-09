package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.*
import com.oblapleon.bidapi.common.security.Hashing
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.EmailService
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.entity.*
import com.oblapleon.bidapi.feature.user.repo.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Service responsible for handling user authentication flows including registration,
 * login, email verification, and account restoration.
 */
@Service
class AuthService(
    private val userService: UserService,
    private val roleRepo: RoleRepo,
    private val userRepo: UserRepo,
    private val verificationTokenRepo: VerificationTokenRepo,
    private val emailService: EmailService,
    private val hashing: Hashing,
    private val jwtTokenProvider: JwtTokenProvider
) {

    @Transactional
    fun register(payload: RegisterReqDto): String {
        if (userService.existsByName(payload.username)) throw AlreadyExistsException("Username taken.")
        if (userService.existsByEmail(payload.email)) throw AlreadyExistsException("Email in use.")

        val userRole = roleRepo.findByName(ERole.USER)

        val user = User(
            username = payload.username,
            password = hashing.hashBcrypt(payload.password),
            email = payload.email,
            roles = mutableSetOf(userRole),
            enabled = true
        )
        val savedUser = userRepo.save(user)

        val token = VerificationToken(user = savedUser)
        verificationTokenRepo.save(token)
        emailService.sendVerificationEmail(savedUser.email, token.token)

        return "Registration successful. Please verify email."
    }

    fun login(payload: LoginReqDto): AuthRespDto {
        val user = try {
            userService.findByName(payload.username)
        } catch (e: NotFoundException) {
            throw UnauthorizedException("Invalid credentials. " +
                    "Check your username and password.")
        }

        if (!hashing.checkBcrypt(payload.password, user.password!!)) {
            throw UnauthorizedException("Invalid credentials. " +
                    "Check your username and password.")
        }

        if (user.deletedAt != null) {
            throw UnauthorizedException("Account deleted. " +
                    "You can restore it clicking on Restore Account button.")
        }

        if (!user.enabled) {
            throw UnauthorizedException("Account not verified." +
                    "You can verify it via email.")
        }

        return AuthRespDto(token = jwtTokenProvider.createToken(user))
    }

    @Transactional
    fun verifyAccount(token: String): String {
        val verificationToken = verificationTokenRepo.findByToken(token)
            ?: throw BadRequestException("Invalid or expired token")

        if (verificationToken.expiryDate.isBefore(LocalDateTime.now())) {
            throw BadRequestException("Token has expired.")
        }

        val user = verificationToken.user
        if (!user.enabled) {
            user.enabled = true
            userRepo.save(user)
        }

        // Clean up token after use
        verificationTokenRepo.delete(verificationToken)
        return "Account verified successfully! Now you can login."
    }

    fun restoreAccount(payload: LoginReqDto) {
        userService.restoreUser(payload)
    }
}