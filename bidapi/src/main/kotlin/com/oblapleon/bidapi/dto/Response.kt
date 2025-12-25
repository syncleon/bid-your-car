package com.oblapleon.bidapi.dto

import com.oblapleon.bidapi.entity.ERole


data class LoginResponseDto(val token: String)

data class RoleDto(val name: ERole)

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val roles: Set<RoleDto>
)