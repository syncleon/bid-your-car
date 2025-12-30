package com.oblapleon.bidapi.common.mapper

import com.oblapleon.bidapi.feature.user.dto.RoleDto
import com.oblapleon.bidapi.feature.user.dto.UserDto
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto =
    UserDto(
        id = id!!,
        username = username,
        email = email,
        roles = roles.map { it.toDto() }.toSet()
    )