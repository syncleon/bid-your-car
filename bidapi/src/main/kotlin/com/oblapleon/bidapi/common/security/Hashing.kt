package com.oblapleon.bidapi.common.security

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

/**
 * Utility component providing high-level abstraction for password hashing operations.
 * Wraps the Spring Security [PasswordEncoder] to provide consistent BCrypt
 * hashing and verification across the application.
 */
@Component
class Hashing(
    private val passwordEncoder: PasswordEncoder
) {

    /**
     * Verifies a raw string against a BCrypt hash.
     * * @param input The raw input string (e.g., a user-provided password).
     * @param hash The encoded hash to compare against.
     * @return True if the raw string matches the hash, false otherwise.
     */
    fun checkBcrypt(input: String, hash: String?): Boolean {
        return passwordEncoder.matches(input, hash)
    }

    /**
     * Generates a secure BCrypt hash for a given raw string.
     * * @param input The raw string to be encoded.
     * @return An encoded string formatted as a BCrypt hash.
     */
    fun hashBcrypt(input: String): String? {
        return passwordEncoder.encode(input)
    }
}