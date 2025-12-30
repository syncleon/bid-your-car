package com.oblapleon.bidapi.feature.user.dto

import jakarta.validation.constraints.Email

data class LoginReqDto(
    val username: String,
    val password: String,
)

data class RegisterReqDto(
    val username: String,
    val password: String,
    @field:Email
    val email: String,
)