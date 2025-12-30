package com.oblapleon.bidapi.feature.user.service

import com.oblapleon.bidapi.common.exceptions.BadRequestException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class PasswordService(
    private val passwordEncoder: PasswordEncoder
) {

    fun encode(rawPassword: String): String? {
        validate(rawPassword)
        return passwordEncoder.encode(rawPassword)
    }

    fun matches(rawPassword: String, encodedPassword: String?): Boolean =
        passwordEncoder.matches(rawPassword, encodedPassword)

    fun validate(password: String) {
        if (password.length < 6) {
            throw BadRequestException("Password must be at least 6 characters long")
        }
    }
}