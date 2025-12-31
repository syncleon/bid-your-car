package com.oblapleon.bidapi.common.helpers

import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Component

@Component
class AuthorizationHelper {

    /**
     * Throws AccessDeniedException if the current user is neither an ADMIN
     * nor the owner of the target resource (matching targetUserId).
     */
    fun checkOwnerOrAdmin(currentUser: User, targetUserId: Long) {
        // Check if user has ADMIN role
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        // Check if user ID matches the target ID
        val isOwner = currentUser.id == targetUserId

        if (!isAdmin && !isOwner) {
            throw AccessDeniedException("You are not authorized to perform this action")
        }
    }
}