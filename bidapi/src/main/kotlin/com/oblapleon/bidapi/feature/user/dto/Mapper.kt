package com.oblapleon.bidapi.feature.user.dto

import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto =
    UserDto(
        id = id!!,
        username = username,
        email = email,
        roles = roles.map { it.toDto() }.toSet(),
        createDate = createdDate
    )