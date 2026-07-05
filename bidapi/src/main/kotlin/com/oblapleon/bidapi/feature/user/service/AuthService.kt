package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exception.AlreadyExistsException
import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.EmailService
import com.oblapleon.bidapi.feature.user.dto.AuthRespDto
import com.oblapleon.bidapi.feature.user.dto.LoginReqDto
import com.oblapleon.bidapi.feature.user.dto.RegisterReqDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.entity.VerificationToken
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import com.oblapleon.bidapi.feature.user.repository.VerificationTokenRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.beans.factory.annotation.Value

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val verificationTokenRepository: VerificationTokenRepository,
    private val emailService: EmailService,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val userService: UserService, // Injected to delegate restore logic
    @Value("\${app.features.email-verification.enabled:true}")
    private val isEmailVerificationEnabled: Boolean
) {
    companion object {
        private const val DUMMY_BCRYPT_HASH = "\$2a\$10\$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGFGL91Q1PdTzRjXWfJW"
    }

    @Transactional
    fun register(payload: RegisterReqDto): String {
        val safeUsername = payload.username ?: throw BadRequestException("Username is required")
        val safeEmail = payload.email ?: throw BadRequestException("Email is required")
        val safePassword = payload.password ?: throw BadRequestException("Password is required")

        if (userRepository.existsByUsername(safeUsername)) {
            throw AlreadyExistsException("Username '$safeUsername' is already taken.")
        }
        if (userRepository.existsByEmail(safeEmail)) {
            throw AlreadyExistsException("Email '$safeEmail' is already in use.")
        }

        val userRole = roleRepository.findByName(ERole.USER)
            ?: throw IllegalStateException("System Error: Default role USER not initialized in DB.")

        val user = User(
            username = safeUsername,
            password = passwordEncoder.encode(safePassword), // Now guaranteed non-null
            email = safeEmail,
            roles = mutableSetOf(userRole),
            enabled = !isEmailVerificationEnabled
        )

        val savedUser = userRepository.save(user)

        if (isEmailVerificationEnabled) {
            val token = VerificationToken(user = savedUser)
            verificationTokenRepository.save(token)
            emailService.sendVerificationEmail(savedUser.email, token.token)
            return "Registration successful. Please check your email to verify your account."
        } else {
            return "Registration successful. You can now log in."
        }
    }

    fun login(payload: LoginReqDto): AuthRespDto {
        val safeUsername = payload.username ?: throw BadRequestException("Username required")
        val safePassword = payload.password ?: throw BadRequestException("Password required")

        val user = userRepository.findAnyByUsername(safeUsername)

        if (user == null) {
            passwordEncoder.matches(safePassword, DUMMY_BCRYPT_HASH)
            throw UnauthorizedException("Invalid credentials.")
        }

        if (!passwordEncoder.matches(safePassword, user.password)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        if (user.deletedAt != null) {
            throw UnauthorizedException("Account deleted. You can restore it by clicking 'Restore Account'.")
        }

        if (!user.enabled) {
            throw UnauthorizedException("Account not verified. Please verify via the email sent to you.")
        }

        return AuthRespDto(token = jwtTokenProvider.createToken(user))
    }

    @Transactional
    fun verifyAccount(tokenString: String) { // <-- Removed the : String return type
        val verificationToken = verificationTokenRepository.findByToken(tokenString)
            ?: throw BadRequestException("Invalid or expired verification token.")

        if (verificationToken.isExpired()) {
            throw BadRequestException("Token has expired. Please request a new one.")
        }

        val user = verificationToken.user

        if (!user.enabled) {
            user.enabled = true
            userRepository.save(user)
        }

        verificationTokenRepository.delete(verificationToken)
    }

    @Transactional
    fun restoreAccount(payload: LoginReqDto): String {
        userService.restoreUser(payload)
        return "Account restored successfully."
    }
}