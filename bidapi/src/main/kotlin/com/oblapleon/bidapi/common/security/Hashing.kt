package com.oblapleon.bidapi.common.security

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
        return passwordEncoder.encode(input)
    }
}