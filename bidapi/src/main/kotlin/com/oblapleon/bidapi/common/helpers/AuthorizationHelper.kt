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
    private val userRepository: UserRepository
) {

    fun getCurrentUser(): User {
        val auth = SecurityContextHolder.getContext().authentication

        if (auth == null || !auth.isAuthenticated || auth is AnonymousAuthenticationToken) {
            throw UnauthorizedException("User is not authenticated.")
        }

        return auth.toUser()
    }

    fun checkOwnerOrAdmin(targetUserId: Long): User {
        val user = getCurrentUser()

        if (user.id == targetUserId) return user
        if (user.roles.any { it.name == ERole.ADMIN }) return user

        throw AccessDeniedException("You do not have permission to access or modify this resource.")
    }

    private fun Authentication.toUser(): User {
        val principal = this.principal

        if (principal is User) {
            return principal
        }

        if (principal is Jwt) {
            val userIdRaw = principal.claims["uid"]
            if (userIdRaw != null) {
                val userId = userIdRaw.toString().toLongOrNull()
                    ?: throw AccessDeniedException("Invalid userId format in token.")
                return userRepository.findById(userId).orElseThrow {
                    AccessDeniedException("User ID found in token does not exist.")
                }
            }

            val username = principal.subject
                ?: throw AccessDeniedException("JWT does not contain a subject.")

            return userRepository.findByUsername(username).orElseThrow {
                AccessDeniedException("User '$username' does not exist.")
            }
        }

        if (principal is String) {
            if (principal == "anonymousUser") throw UnauthorizedException("Not authenticated.")

            val userId = principal.toLongOrNull()
            if (userId != null) {
                return userRepository.findById(userId).orElseThrow {
                    AccessDeniedException("User ID $userId does not exist.")
                }
            }

            return userRepository.findByUsername(principal).orElseThrow {
                AccessDeniedException("User with username '$principal' does not exist.")
            }
        }

        throw AccessDeniedException("Security Principal is not a valid User entity. Found: ${principal?.javaClass?.name}")
    }
}