package com.oblapleon.bidapi.dto

import com.oblapleon.bidapi.entity.RoleEntity
import com.oblapleon.bidapi.entity.UserEntity

fun RoleEntity.toDto(): RoleDto =
    RoleDto(name = name)

fun UserEntity.toDto(): UserDto =
    UserDto(
        id = id!!,
        username = username,
        email = email,
        roles = roles.map { it.toDto() }.toSet()
    )