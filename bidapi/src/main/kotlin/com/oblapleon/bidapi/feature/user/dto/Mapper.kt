package com.oblapleon.bidapi.feature.user.dto

import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto = UserDto(
    id = id ?: throw IllegalStateException("Cannot map User to DTO: ID is null"),
    username = username,
    email = email,
    bio = bio,
    profilePhotoUrl = profilePhotoUrl,
    roles = roles.map { it.toDto() }.toSet(),
    createdDate = createdDate,
    enabled = enabled
)