package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management APIs")
class UserController(
    private val userService: UserService,
    private val authHelper: AuthorizationHelper
) : BaseController() {

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    fun getCurrentUser() = handleRequest {
        authHelper.getCurrentUser().toDto()
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me/profile")
    fun updateCurrentUserProfile(
        @Valid @RequestBody request: UpdateProfileReqDto
    ) = handleRequest {
        val currentUser = authHelper.getCurrentUser()
        userService.updateProfile(
            id = currentUser.id!!,
            username = request.username,
            email = request.email
        ).toDto()
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    fun changePassword(
        @Valid @RequestBody request: UpdatePasswordReqDto
    ) = handleRequest {
        val currentUser = authHelper.getCurrentUser()
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
    fun getAllUsers() = handleRequest {
        userService.findAll().map { it.toDto() }
    }

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long) = handleRequest {
        // Automatically checks if requester is Admin or Owner of 'id'
        authHelper.checkOwnerOrAdmin(id)
        userService.findById(id).toDto()
    }

    @Operation(summary = "Update user", description = "Update user data (Admin or owner)")
    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserReqDto
    ) = handleRequest {
        // Fixed: No longer passing 'currentUser'
        authHelper.checkOwnerOrAdmin(id)
        userService.update(id, request).toDto()
    }

    @Operation(summary = "Delete user (Soft Delete)")
    @DeleteMapping("/{id}")
    fun deleteUser(
        @PathVariable id: Long,
        @RequestBody(required = false) payload: DeleteAccountReqDto?
    ) = handleRequest {
        // Fixed: Extracts user internally and verifies ownership/admin
        val currentUser = authHelper.checkOwnerOrAdmin(id)

        userService.deleteWithVerification(
            initiator = currentUser,
            targetUserId = id,
            password = payload?.password
        )
        null
    }

    // Admin & Search Endpoints
    @GetMapping("/search/username")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchByUsername(@RequestParam query: String) =
        handleRequest { userService.searchByUsernameContains(query).map { it.toDto() } }

    @GetMapping("/search/email")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchByEmail(@RequestParam query: String) =
        handleRequest { userService.searchByEmailContains(query).map { it.toDto() } }

    @GetMapping("/exists/username/{username}")
    fun checkUsernameExists(@PathVariable username: String) =
        handleRequest { userService.existsByName(username) }

    @GetMapping("/exists/email/{email}")
    fun checkEmailExists(@PathVariable email: String) =
        handleRequest { userService.existsByEmail(email) }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    fun getUserStats() = handleRequest { UserStatsDto(totalUsers = userService.countAll()) }

    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN')")
    fun getUsersByIds(@RequestBody request: UserBatchRequest) =
        handleRequest { userService.findByIds(request.userIds).map { it.toDto() } }
}