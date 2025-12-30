package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.mapper.toDto
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management APIs")
class UserController(
    private val userService: UserService
) : BaseController() {

    @Operation(summary = "Get all users", description = "Returns all users (Admin only)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllUsers() =
        handleRequest {
            userService.findAll().map { it.toDto() }
        }

    @Operation(summary = "Get user by ID", description = "Returns a single user by ID")
    @GetMapping("/{id}")
    fun getUserById(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long
    ) = handleRequest {
        val user = userService.findById(id)
        if (!userDetails.authorities.any { it.authority == "ROLE_ADMIN" } &&
            user.username != userDetails.username
        ) {
            throw org.springframework.security.access.AccessDeniedException("Not allowed")
        }
        user.toDto()
    }

    @Operation(summary = "Update user", description = "Update user data (Admin or owner)")
    @PutMapping("/{id}")
    fun updateUser(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long,
        @Valid @RequestBody request: UserUpdateRequest
    ) = handleRequest {
        val user = userService.findById(id)
        if (!userDetails.authorities.any { it.authority == "ROLE_ADMIN" } &&
            user.username != userDetails.username
        ) {
            throw org.springframework.security.access.AccessDeniedException("Not allowed")
        }
        userService.update(id, request).toDto()
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me/profile")
    fun updateCurrentUserProfile(
        @AuthenticationPrincipal userDetails: UserDetails,
        @Valid @RequestBody request: ProfileUpdateRequest
    ) = handleRequest {
        val user = userService.findByName(userDetails.username)
        userService.updateProfile(
            id = user.id!!,
            username = request.username,
            email = request.email
        ).toDto()
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    fun changePassword(
        @AuthenticationPrincipal userDetails: UserDetails,
        @Valid @RequestBody request: ChangePasswordRequest
    ) = handleRequest {
        val user = userService.findByName(userDetails.username)
        userService.changePassword(
            id = user.id!!,
            oldPassword = request.oldPassword,
            newPassword = request.newPassword
        )
        null
    }

    @Operation(summary = "Delete user (Admin only)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun deleteUser(@PathVariable id: Long) = handleRequest {
        userService.delete(id)
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

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal userDetails: UserDetails) =
        handleRequest { userService.findByName(userDetails.username).toDto() }

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
