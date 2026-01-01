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

@Service
class AuthService(
    private val userService: UserService,
    private val roleRepo: RoleRepo,
    private val verificationTokenRepo: VerificationTokenRepo,
    private val emailService: EmailService,
    private val hashing: Hashing,
    private val jwtTokenProvider: JwtTokenProvider
) {

    @Transactional
    fun register(payload: RegisterReqDto): String {
        if (userService.existsByName(payload.username)) {
            throw AlreadyExistsException("User with this name already exists.")
        }
        if (userService.existsByEmail(payload.email)) {
            throw AlreadyExistsException("Email is already in use.")
        }

        val userRole = roleRepo.findByName(ERole.USER)
            ?: throw NotFoundException("Default role not found")

        // 1. Save User (Enabled = false)
        val user = User(
            username = payload.username,
            password = hashing.hashBcrypt(payload.password),
            email = payload.email,
            roles = mutableSetOf(userRole),
            enabled = false // Important
        )
        val savedUser = userService.save(user)

        // 2. Create Token
        val token = VerificationToken(user = savedUser)
        verificationTokenRepo.save(token)

        // 3. Send Email
        emailService.sendVerificationEmail(savedUser.email, token.token)

        return "Registration successful. Please check your email to verify your account."
    }

    fun login(payload: LoginReqDto): AuthRespDto {
        val user = userService.findByName(payload.username)

        if (!hashing.checkBcrypt(payload.password, user.password!!)) {
            throw UnauthorizedException("Incorrect password.")
        }

        // 4. Verification Check
        if (!user.enabled) {
            throw UnauthorizedException("Account is not verified. Please check your email.")
        }

        return AuthRespDto(token = jwtTokenProvider.createToken(user))
    }

    @Transactional
    fun verifyAccount(token: String): String {
        val verificationToken = verificationTokenRepo.findByToken(token)
            ?: throw BadRequestException("Invalid verification token")

        if (verificationToken.expiryDate.isBefore(LocalDateTime.now())) {
            throw BadRequestException("Token has expired")
        }

        val user = verificationToken.user
        if (user.enabled) return "Account already verified"

        user.enabled = true
        userService.save(user)
        
        verificationTokenRepo.delete(verificationToken) // Cleanup
        
        return "Account verified successfully!"
    }
}