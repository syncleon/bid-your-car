package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.core.Authentication

fun Authentication.toUser(): User {
    return principal as User
}