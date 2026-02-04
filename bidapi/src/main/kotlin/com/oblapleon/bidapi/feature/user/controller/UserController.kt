package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management APIs")
class UserController(
    private val userService: UserService,
    private val authHelper: AuthorizationHelper
) {

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    fun getCurrentUser(): UserDto {
        return authHelper.getCurrentUser().toDto()
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me/profile")
    fun updateCurrentUserProfile(@Valid @RequestBody request: UpdateProfileReqDto): UserDto {
        val currentUser = authHelper.getCurrentUser()
        // Convert UpdateProfileReqDto to UpdateUserReqDto for shared service logic
        val updateReq = UpdateUserReqDto(username = request.username, email = request.email)
        return userService.updateUser(currentUser.id!!, updateReq, isSelfUpdate = true).toDto()
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    fun changePassword(@Valid @RequestBody request: UpdatePasswordReqDto) {
        val currentUser = authHelper.getCurrentUser()
        userService.changePassword(
            id = currentUser.id!!,
            oldPass = request.oldPassword,
            newPass = request.newPassword
        )
    }

    @Operation(summary = "Get all users (Admin)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllUsers(@PageableDefault(size = 20) pageable: Pageable): Page<UserDto> {
        return userService.findAll(pageable).map { it.toDto() }
    }

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): UserDto {
        authHelper.checkOwnerOrAdmin(id)
        return userService.findById(id).toDto()
    }

    @Operation(summary = "Update user (Admin)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserReqDto
    ): UserDto {
        // We assume only Admin hits this specific endpoint to modify others
        return userService.updateUser(id, request, isSelfUpdate = false).toDto()
    }

    @Operation(summary = "Delete user (Soft Delete)")
    @DeleteMapping("/{id}")
    fun deleteUser(
        @PathVariable id: Long,
        @RequestBody(required = false) payload: DeleteAccountReqDto?
    ) {
        val currentUser = authHelper.checkOwnerOrAdmin(id)
        userService.deleteWithVerification(
            initiator = currentUser,
            targetUserId = id,
            password = payload?.password
        )
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchUsers(
        @RequestParam(required = false) username: String?,
        @RequestParam(required = false) email: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): Page<UserDto> {
        return when {
            !username.isNullOrBlank() -> userService.searchByUsername(username, pageable).map { it.toDto() }
            !email.isNullOrBlank() -> userService.searchByEmail(email, pageable).map { it.toDto() }
            else -> Page.empty()
        }
    }
}