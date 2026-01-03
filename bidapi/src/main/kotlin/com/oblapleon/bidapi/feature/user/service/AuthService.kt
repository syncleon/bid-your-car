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
    private val verificationTokenRepo: VerificationTokenRepo,
    private val emailService: EmailService,
    private val hashing: Hashing,
    private val jwtTokenProvider: JwtTokenProvider
) {

    /**
     * Registers a new user with the provided credentials.
     * Checks for existing usernames or emails, assigns the default user role,
     * creates a verification token, and sends a verification email.
     *
     * @param payload The registration request containing username, email, and password.
     * @return A success message indicating that the verification email has been sent.
     * @throws AlreadyExistsException If the username or email is already in use.
     * @throws NotFoundException If the default user role is not found in the database.
     */
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

        val user = User(
            username = payload.username,
            password = hashing.hashBcrypt(payload.password),
            email = payload.email,
            roles = mutableSetOf(userRole),
            enabled = false
        )
        val savedUser = userService.save(user)

        val token = VerificationToken(user = savedUser)
        verificationTokenRepo.save(token)

        emailService.sendVerificationEmail(savedUser.email, token.token)

        return "Registration successful. Please check your email to verify your account."
    }

    /**
     * Authenticates a user based on the provided login credentials.
     * Performs validation checks for password correctness, account deletion status,
     * and email verification status before generating a JWT token.
     *
     * @param payload The login request containing username and password.
     * @return An [AuthRespDto] containing the generated JWT token.
     * @throws UnauthorizedException If the password is incorrect, the account is deleted, or the account is not verified.
     */
    fun login(payload: LoginReqDto): AuthRespDto {
        val user = userService.findByName(payload.username)

        if (!hashing.checkBcrypt(payload.password, user.password!!)) {
            throw UnauthorizedException("Incorrect password.")
        }

        if (user.deletedAt != null) {
            throw UnauthorizedException("This account has been deleted and is scheduled for permanent removal.")
        }

        if (!user.enabled) {
            throw UnauthorizedException("Account is not verified. Please check your email.")
        }

        return AuthRespDto(token = jwtTokenProvider.createToken(user))
    }

    /**
     * Verifies a user's account using the provided verification token.
     * Validates the token's existence and expiration date, enables the user account,
     * and removes the token upon successful verification.
     *
     * @param token The verification token string received via email.
     * @return A success message indicating the account has been verified.
     * @throws BadRequestException If the token is invalid or expired.
     */
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

        verificationTokenRepo.delete(verificationToken)

        return "Account verified successfully!"
    }

    /**
     * Restores a soft-deleted account by delegating the restoration logic to the user service.
     * Requires valid credentials (username and password) to authorize the restoration.
     *
     * @param payload The login credentials required to identify and authorize the user.
     */
    fun restoreAccount(payload: LoginReqDto) {
        userService.restoreUser(payload)
    }
}