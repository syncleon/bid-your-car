package com.oblapleon.bidapi.feature.user.dto

import com.oblapleon.bidapi.feature.user.entity.ERole
import java.time.Instant


data class AuthRespDto(val token: String)

data class RoleDto(val name: ERole)

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val roles: Set<RoleDto>,
    val createDate: Instant?
)