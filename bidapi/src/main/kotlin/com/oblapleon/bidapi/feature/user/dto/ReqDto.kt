package com.oblapleon.bidapi.feature.user.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

// ============================================================================
//  Authentication Requests
// ============================================================================

data class LoginReqDto(
    @field:NotBlank(message = "Username is required")
    val username: String,

    @field:NotBlank(message = "Password is required")
    val password: String,
)

data class RegisterReqDto(
    @field:NotBlank(message = "Username is required")
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @field:Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    val username: String,

    @field:NotBlank(message = "Password is required")
    @field:Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    val password: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,
)

data class DeleteAccountReqDto(
    @field:NotBlank(message = "Password is required to confirm deletion")
    val password: String
)

// ============================================================================
//  User Management Requests
// ============================================================================

data class UpdateUserReqDto(
    @field:Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @field:Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    val username: String? = null,

    @field:Email(message = "Email must be valid")
    @field:Size(max = 100, message = "Email cannot exceed 100 characters")
    val email: String? = null,

    @field:Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    val password: String? = null
)

data class UpdateProfileReqDto(
    @field:Size(min = 3, max = 50)
    @field:Pattern(regexp = "^[a-zA-Z0-9_]+$")
    val username: String? = null,

    @field:Email
    @field:Size(max = 100)
    val email: String? = null
)

data class UpdatePasswordReqDto(
    @field:NotBlank(message = "Old password is required")
    val oldPassword: String,

    @field:NotBlank(message = "New password is required")
    @field:Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
    val newPassword: String
)

data class UserBatchRequest(
    @field:NotEmpty(message = "User ID list cannot be empty")
    val userIds: Set<Long>
)