package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
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
    fun getCurrentUser(): ResponseEntity<Any> {
        return handleRequest {
            authHelper.getCurrentUser().toDto()
        }
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me/profile")
    fun updateCurrentUserProfile(@Valid @RequestBody request: UpdateProfileReqDto): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            val updateReq = UpdateUserReqDto(username = request.username, email = request.email)
            userService.updateUser(currentUser.id!!, updateReq, isSelfUpdate = true).toDto()
        }
    }

    @Operation(summary = "Change password")
    @PutMapping("/me/change-password")
    fun changePassword(@Valid @RequestBody request: UpdatePasswordReqDto): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            userService.changePassword(
                id = currentUser.id!!,
                oldPass = request.oldPassword,
                newPass = request.newPassword
            )
            mapOf("message" to "Password updated successfully")
        }
    }

    @Operation(summary = "Get all users (Admin)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAllUsers(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Any> {
        return handleRequest {
            userService.findAll(pageable).map { it.toDto() }
        }
    }

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<Any> {
        return handleRequest {
            authHelper.checkOwnerOrAdmin(id)
            userService.findById(id).toDto()
        }
    }

    @Operation(summary = "Update user (Admin)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserReqDto
    ): ResponseEntity<Any> {
        return handleRequest {
            userService.updateUser(id, request, isSelfUpdate = false).toDto()
        }
    }

    @Operation(summary = "Delete user (Soft Delete)")
    @DeleteMapping("/{id}")
    fun deleteUser(
        @PathVariable id: Long,
        @RequestBody(required = false) payload: DeleteAccountReqDto?
    ): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.checkOwnerOrAdmin(id)
            userService.deleteWithVerification(
                initiator = currentUser,
                targetUserId = id,
                password = payload?.password
            )
            mapOf("message" to "User account soft-deleted successfully")
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchUsers(
        @RequestParam(required = false) username: String?,
        @RequestParam(required = false) email: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            when {
                !username.isNullOrBlank() -> userService.searchByUsername(username, pageable).map { it.toDto() }
                !email.isNullOrBlank() -> userService.searchByEmail(email, pageable).map { it.toDto() }
                else -> emptyList<UserDto>()
            }
        }
    }
}