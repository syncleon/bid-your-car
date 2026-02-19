package com.oblapleon.bidapi.common.helpers

import com.oblapleon.bidapi.common.exception.UnauthorizedException
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.AnonymousAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component

@Component
class AuthorizationHelper(
    private val userRepository: UserRepository // <-- ADDED: Inject the repository
) {

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
     * Retrieves the current user safely. Returns null if the user is unauthenticated
     * (useful for public endpoints with optional authentication).
     */
    fun getCurrentUserOrNull(): User? {
        val auth = SecurityContextHolder.getContext().authentication

        if (auth == null || !auth.isAuthenticated || auth is AnonymousAuthenticationToken) {
            return null
        }

        return try {
            auth.toUser()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Safe cast extension to extract our Domain User from the Authentication principal.
     */
    /**
     * Safe cast extension to extract our Domain User from the Authentication principal.
     */
    private fun Authentication.toUser(): User {
        val principal = this.principal

        // Scenario 1: It's already our User entity
        if (principal is User) {
            return principal
        }

        // Scenario 2: It's a standard Spring Security JWT
        if (principal is Jwt) {
            // Extract the numeric ID from your custom claim
            val userIdRaw = principal.claims["userId"]
            if (userIdRaw != null) {
                val userId = userIdRaw.toString().toLongOrNull()
                    ?: throw AccessDeniedException("Invalid userId format in token.")
                return userRepository.findById(userId).orElseThrow {
                    AccessDeniedException("User ID found in token does not exist.")
                }
            }

            // Fallback to subject (username) if the claim is missing
            val username = principal.subject
                ?: throw AccessDeniedException("JWT does not contain a subject.")

            return userRepository.findByUsername(username).orElseThrow {
                AccessDeniedException("User '$username' does not exist.")
            }
        }

        // Scenario 3: The principal was flattened to a String (e.g., "user_1")
        if (principal is String) {
            if (principal == "anonymousUser") throw UnauthorizedException("Not authenticated.")

            // Try treating it as a numeric ID first
            val userId = principal.toLongOrNull()
            if (userId != null) {
                return userRepository.findById(userId).orElseThrow {
                    AccessDeniedException("User ID $userId does not exist.")
                }
            }

            // Since it's not a number (e.g., "user_1"), look it up by username
            return userRepository.findByUsername(principal).orElseThrow {
                AccessDeniedException("User with username '$principal' does not exist.")
            }
        }

        throw AccessDeniedException("Security Principal is not a valid User entity. Found: ${principal?.javaClass?.name}")
    }
}