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

    /**
     * Registers a new user account.
     * Checks for username and email uniqueness before creating the user.
     * If email verification is enabled, sends a verification email.
     *
     * @param payload The registration request containing username, email, and password.
     * @return A success message.
     * @throws BadRequestException if required fields are missing.
     * @throws AlreadyExistsException if username or email is already taken.
     */
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

    /**
     * Authenticates a user and generates a JWT token.
     * Verifies that the account is active and verified.
     *
     * @param payload The login request containing username and password.
     * @return An [AuthRespDto] containing the JWT token.
     * @throws UnauthorizedException if credentials are invalid, account is deleted, or unverified.
     */
    fun login(payload: LoginReqDto): AuthRespDto {
        val safeUsername = payload.username ?: throw BadRequestException("Username required")
        val safePassword = payload.password ?: throw BadRequestException("Password required")

        // First check if user is deleted using native query
        val deletedAt = userRepository.findDeletedAtByUsername(safeUsername)
        if (deletedAt != null) {
            throw UnauthorizedException("Account deleted. You can restore it by clicking 'Restore Account'.")
        }

        val user = userRepository.findByUsername(safeUsername).orElse(null)

        if (user == null) {
            passwordEncoder.matches(safePassword, DUMMY_BCRYPT_HASH)
            throw UnauthorizedException("Invalid credentials.")
        }

        if (!passwordEncoder.matches(safePassword, user.password)) {
            throw UnauthorizedException("Invalid credentials.")
        }

        if (!user.enabled) {
            throw UnauthorizedException("Account not verified. Please verify via the email sent to you.")
        }

        return AuthRespDto(token = jwtTokenProvider.createToken(user))
    }

    /**
     * Verifies a user's email account using the provided token.
     *
     * @param tokenString The verification token from the email link.
     * @throws BadRequestException if the token is invalid or expired.
     */
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

    /**
     * Restores a previously soft-deleted user account.
     *
     * @param payload The login credentials of the account to restore.
     * @return A success message.
     */
    @Transactional
    fun restoreAccount(payload: LoginReqDto): String {
        userService.restoreUser(payload)
        return "Account restored successfully."
    }
}