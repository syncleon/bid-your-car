package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

/**
 * Service responsible for password lifecycle management and security enforcement.
 * Provides abstraction for password hashing, comparison, and complexity validation
 * using the configured [PasswordEncoder].
 */
@Service
class PasswordService(
    private val passwordEncoder: PasswordEncoder
) {

    /**
     * Validates and hashes a raw password string.
     *
     * @param rawPassword The plain-text password to be processed.
     * @return The securely encoded password hash.
     * @throws BadRequestException if the password does not meet complexity requirements.
     */
    fun encode(rawPassword: String): String? {
        validate(rawPassword)
        return passwordEncoder.encode(rawPassword)
    }

    /**
     * Checks if a raw password matches an existing encoded hash.
     *
     * @param rawPassword The plain-text password to verify.
     * @param encodedPassword The stored hash to compare against.
     * @return True if the password matches the hash, false otherwise.
     */
    fun matches(rawPassword: String, encodedPassword: String?): Boolean =
        passwordEncoder.matches(rawPassword, encodedPassword)

    /**
     * Enforces password complexity rules.
     * Current policy requires a minimum length of 6 characters.
     *
     * @param password The raw password string to validate.
     * @throws BadRequestException if the password is too short.
     */
    fun validate(password: String) {
        if (password.length < 6) {
            throw BadRequestException("Password must be at least 6 characters long")
        }
    }
}