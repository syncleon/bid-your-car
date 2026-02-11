package com.oblapleon.bidapi.feature.user.dto

import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto = UserDto(
    // We throw an exception here because a UserDto should never be sent
    // to the client if the entity hasn't been persisted (assigned an ID) yet.
    id = id ?: throw IllegalStateException("Cannot map User to DTO: ID is null"),
    username = username,
    email = email,
    roles = roles.map { it.toDto() }.toSet(),
    createdDate = createdDate
)