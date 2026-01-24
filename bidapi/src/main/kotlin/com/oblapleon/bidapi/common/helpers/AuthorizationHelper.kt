package com.oblapleon.bidapi.common.helpers

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class AuthorizationHelper {

    /**
     * Retrieves the User entity directly from the SecurityContext.
     */
    fun getCurrentUser(): User {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw AccessDeniedException("No authentication found")
        return auth.toUser()
    }

    /**
     * Combines user retrieval and permission checking.
     * Returns the current user if they are an ADMIN or the OWNER.
     */
    fun checkOwnerOrAdmin(targetUserId: Long): User {
        val user = getCurrentUser()
        val isAdmin = user.roles.any { it.name == ERole.ADMIN }
        val isOwner = user.id == targetUserId

        if (!isAdmin && !isOwner) {
            throw AccessDeniedException("You are not authorized to access this resource")
        }
        return user
    }

    /**
     * Extension to extract the domain User entity from the Authentication object.
     * This works because of our custom UserAuthenticationConverter.
     */
    fun Authentication.toUser(): User {
        val principal = this.principal
        if (principal is User) {
            return principal
        }
        throw AccessDeniedException("Principal is not a valid User entity")
    }
}