package com.oblapleon.bidapi.feature.user.dto

import com.oblapleon.bidapi.feature.user.entity.ERole
import java.io.Serializable
import java.time.Instant

data class AuthRespDto(
    val token: String,
    val type: String = "Bearer"
)

data class RoleDto(
    val name: ERole
) : Serializable

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val bio: String?,
    val profilePhotoUrl: String?,
    val roles: Set<RoleDto>,
    val createdDate: Instant?
) : Serializable