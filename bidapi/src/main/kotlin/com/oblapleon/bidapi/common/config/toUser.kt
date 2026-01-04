package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.core.Authentication

/**
 * Extension functions for the Spring Security [Authentication] interface.
 * Provides a convenient way to access domain-specific user entities from
 * the security context.
 */

/**
 * Extracts the authenticated [User] entity from the current security context.
 * This assumes that the authentication principal has been populated with
 * a domain-specific User object during the authentication process.
 * * @return The [User] entity representing the currently authenticated principal.
 * @throws ClassCastException if the principal is not an instance of [User].
 */
fun Authentication.toUser(): User {
    return principal as User
}