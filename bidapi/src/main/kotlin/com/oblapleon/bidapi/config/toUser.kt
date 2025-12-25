package com.oblapleon.bidapi.config

import com.oblapleon.bidapi.entity.UserEntity
import org.springframework.security.core.Authentication

fun Authentication.toUser(): UserEntity {
    return principal as UserEntity
}