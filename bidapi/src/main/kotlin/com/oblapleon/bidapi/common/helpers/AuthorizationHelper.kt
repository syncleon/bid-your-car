package com.oblapleon.bidapi.common.helpers

import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class AuthorizationHelper {

    /**
     * Retrieves the currently authenticated User entity from the SecurityContext.
     *
     * @return The authenticated User entity.
     * @throws UnauthorizedException If the user is not logged in (401).
     * @throws AccessDeniedException If the security context is invalid (500/403).
     */
    fun getCurrentUser(): User {
        val auth = SecurityContextHolder.getContext().authentication

        if (auth == null || !auth.isAuthenticated || auth is AnonymousAuthenticationToken) {
            throw UnauthorizedException("User is not authenticated.")
        }

        return auth.toUser()
    }

    /**
     * Gatekeeper Method:
     * Returns the current user only if they are the **Owner** of the target resource
     * OR if they have the **ADMIN** role.
     *
     * @param targetUserId The ID of the resource owner.
     * @return The current User entity (detached).
     * @throws AccessDeniedException If the user lacks permission (403).
     */
    fun checkOwnerOrAdmin(targetUserId: Long): User {
        val user = getCurrentUser()

        // 1. Check Ownership (Fastest check)
        if (user.id == targetUserId) return user

        // 2. Check Admin Role (Requires iterating roles, which are eager loaded now)
        if (user.roles.any { it.name == ERole.ADMIN }) return user

        throw AccessDeniedException("You do not have permission to access or modify this resource.")
    }

    /**
     * Safe cast extension to extract our Domain User from the Authentication principal.
     */
    private fun Authentication.toUser(): User {
        val principal = this.principal
        if (principal is User) {
            return principal
        }
        // This should only happen if the UserAuthenticationConverter in SecurityConfig is misconfigured
        throw AccessDeniedException("Security Principal is not a valid User entity.")
    }
}