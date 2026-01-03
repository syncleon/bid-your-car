package com.oblapleon.bidapi.feature.user.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

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

data class DeleteAccountReqDto(
    val password: String
)

data class UserUpdateRequest(
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @field:Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    val username: String? = null,

    @field:Email(message = "Email must be valid")
    @field:Size(max = 100, message = "Email cannot exceed 100 characters")
    val email: String? = null,

    @field:Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    val password: String? = null
)

data class ProfileUpdateRequest(
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @field:Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    val username: String? = null,

    @field:Email(message = "Email must be valid")
    @field:Size(max = 100, message = "Email cannot exceed 100 characters")
    val email: String? = null
)

data class ChangePasswordRequest(
    @field:NotBlank(message = "Old password is required")
    val oldPassword: String,

    @field:NotBlank(message = "New password is required")
    @field:Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
    val newPassword: String
)

data class UserStatsDto(
    val totalUsers: Long
)

data class UserBatchRequest(
    val userIds: Set<Long>
)