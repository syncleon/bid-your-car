package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.mapper.toDto
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management APIs")
class UserController(
    private val userService: UserService,
    private val authHelper: AuthorizationHelper
) : BaseController() {

    // ==========================================
    // 1. SPECIFIC ENDPOINTS (Must be at the top)
    // ==========================================

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal currentUser: User) =
        handleRequest { currentUser.toDto() }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me/profile")
    fun updateCurrentUserProfile(
        @AuthenticationPrincipal currentUser: User,
        @Valid @RequestBody request: ProfileUpdateRequest
    ) = handleRequest {
        userService.updateProfile(
            id = currentUser.id!!,
            username = request.username,
            email = request.email
        ).toDto()
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    fun changePassword(
        @AuthenticationPrincipal currentUser: User,
        @Valid @RequestBody request: ChangePasswordRequest
    ) = handleRequest {
        userService.changePassword(
            id = currentUser.id!!,
            oldPassword = request.oldPassword,
            newPassword = request.newPassword
        )
        null
    }

    @Operation(summary = "Get all users", description = "Returns all users (Admin only)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllUsers() =
        handleRequest {
            userService.findAll().map { it.toDto() }
        }

    // ==========================================
    // 2. DYNAMIC ENDPOINTS (/{id})
    // ==========================================

    @Operation(summary = "Get user by ID", description = "Returns a single user by ID")
    @GetMapping("/{id}")
    fun getUserById(
        @AuthenticationPrincipal currentUser: User,
        @PathVariable id: Long
    ) = handleRequest {
        val targetUser = userService.findById(id)
        authHelper.checkOwnerOrAdmin(currentUser, targetUser.id!!)
        targetUser.toDto()
    }

    @Operation(summary = "Update user", description = "Update user data (Admin or owner)")
    @PutMapping("/{id}")
    fun updateUser(
        @AuthenticationPrincipal currentUser: User,
        @PathVariable id: Long,
        @Valid @RequestBody request: UserUpdateRequest
    ) = handleRequest {
        authHelper.checkOwnerOrAdmin(currentUser, id)
        userService.update(id, request).toDto()
    }

    @Operation(
        summary = "Delete user (Soft Delete)",
        description = "Requires 'password' in body if deleting your own account. Admin can delete without password."
    )
    @DeleteMapping("/{id}")
    fun deleteUser(
        @AuthenticationPrincipal currentUser: User,
        @PathVariable id: Long,
        @RequestBody(required = false) payload: DeleteAccountReqDto?
    ) = handleRequest {

        authHelper.checkOwnerOrAdmin(currentUser, id)
        userService.deleteWithVerification(
            initiator = currentUser,
            targetUserId = id,
            password = payload?.password
        )

        null
    }

    @Operation(summary = "Search users by username (Admin only)")
    @GetMapping("/search/username")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchByUsername(@RequestParam query: String) =
        handleRequest { userService.searchByUsernameContains(query).map { it.toDto() } }

    @Operation(summary = "Search users by email (Admin only)")
    @GetMapping("/search/email")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchByEmail(@RequestParam query: String) =
        handleRequest { userService.searchByEmailContains(query).map { it.toDto() } }

    @Operation(summary = "Check if username exists")
    @GetMapping("/exists/username/{username}")
    fun checkUsernameExists(@PathVariable username: String) =
        handleRequest { userService.existsByName(username) }

    @Operation(summary = "Check if email exists")
    @GetMapping("/exists/email/{email}")
    fun checkEmailExists(@PathVariable email: String) =
        handleRequest { userService.existsByEmail(email) }

    @Operation(summary = "Get user statistics (Admin only)")
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    fun getUserStats() = handleRequest { UserStatsDto(totalUsers = userService.countAll()) }

    @Operation(summary = "Get users by IDs (Admin only)")
    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    fun getUsersByIds(@RequestBody request: UserBatchRequest) =
        handleRequest { userService.findByIds(request.userIds).map { it.toDto() } }
}