package com.oblapleon.bidapi.dto

import jakarta.validation.constraints.Email

data class RegisterNewUserDto(
    val username: String,
    val password: String,
    @field:Email
    val email: String,
)

data class LoginUserDto(
    val username: String,
    val password: String,
)