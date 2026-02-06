package com.oblapleon.bidapi.common.security

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
class Hashing(
    private val passwordEncoder: PasswordEncoder
) {

    fun checkBcrypt(input: String, hash: String?): Boolean {
        return passwordEncoder.matches(input, hash)
    }

    fun hashBcrypt(input: String): String? {
        validatePassword(input)
        return passwordEncoder.encode(input)
    }

    fun validatePassword(password: String) {
        if (password.length < 6) {
            throw BadRequestException("Password must be at least 6 characters long")
        }
    }
}