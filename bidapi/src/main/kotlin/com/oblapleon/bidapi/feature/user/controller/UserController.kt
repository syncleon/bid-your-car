package com.oblapleon.bidapi.feature.user.controller

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import com.oblapleon.bidapi.feature.item.dto.toDto
import com.oblapleon.bidapi.feature.item.service.ItemService
import com.oblapleon.bidapi.feature.user.dto.*
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User profile and administration")
@SecurityRequirement(name = "bearerAuth")
class UserController(
    private val userService: UserService,
    private val itemService: ItemService,
    private val authorizationHelper: AuthorizationHelper // <-- ADDED: Our custom helper
) {

    // ========================================================================
    //  Current User Profile (/me)
    // ========================================================================

    @Operation(summary = "Get My Profile", description = "Returns the profile of the currently logged-in user.")
    @GetMapping("/me")
    fun getCurrentUser(): ResponseEntity<UserDto> {
        // Automatically extracts the JWT, parses the ID, and fetches the DB entity
        val user = authorizationHelper.getCurrentUser()
        return ResponseEntity.ok(user.toDto())
    }

    @Operation(summary = "Update My Profile", description = "Update email or username.")
    @PatchMapping("/me")
    fun updateCurrentUser(
        @Valid @RequestBody request: UpdateProfileReqDto
    ): ResponseEntity<UserDto> {
        val user = authorizationHelper.getCurrentUser()

        val serviceRequest = UpdateUserReqDto(
            username = request.username,
            email = request.email
        )

        val updatedUser = userService.updateUser(user.id!!, serviceRequest, isSelfUpdate = true)
        return ResponseEntity.ok(updatedUser.toDto())
    }

    @Operation(summary = "Change Password", description = "Update login password.")
    @PutMapping("/me/password")
    fun changePassword(
        @Valid @RequestBody request: UpdatePasswordReqDto
    ): ResponseEntity<Map<String, String>> {
        val user = authorizationHelper.getCurrentUser()
        userService.changePassword(user.id!!, request)
        return ResponseEntity.ok(mapOf("message" to "Password updated successfully"))
    }

    @Operation(summary = "My Items", description = "Get items listed by the current user.")
    @GetMapping("/me/items")
    fun getCurrentUserItems(
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<ItemDto>> {
        val user = authorizationHelper.getCurrentUser()
        // Assuming ItemService has findAllBySellerId
        val items = itemService.findAllBySellerId(user.id!!, pageable)
        return ResponseEntity.ok(items.map { it.toDto() })
    }

    @Operation(summary = "Delete My Account", description = "Soft-delete account. Requires password confirmation.")
    @DeleteMapping("/me")
    fun deleteMyAccount(
        @Valid @RequestBody request: DeleteAccountReqDto
    ): ResponseEntity<Map<String, String>> {
        val user = authorizationHelper.getCurrentUser()
        userService.deleteMyAccount(user.id!!, request.password)
        return ResponseEntity.ok(mapOf("message" to "Account deleted successfully"))
    }

    // ========================================================================
    //  Admin Operations
    // ========================================================================

    @Operation(summary = "List All Users", description = "Admin only. Returns paginated list of users.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    fun getAllUsers(@PageableDefault(size = 20) pageable: Pageable): ResponseEntity<Page<UserDto>> {
        val users = userService.findAll(pageable)
        return ResponseEntity.ok(users.map { it.toDto() })
    }

    @Operation(summary = "Get User by ID", description = "Admin only.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<UserDto> {
        val user = userService.findById(id)
        return ResponseEntity.ok(user.toDto())
    }

    @Operation(summary = "Update User (Admin)", description = "Admin force update.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateUserReqDto
    ): ResponseEntity<UserDto> {
        val updatedUser = userService.updateUser(id, request, isSelfUpdate = false)
        return ResponseEntity.ok(updatedUser.toDto())
    }

    @Operation(summary = "Ban/Deactivate User", description = "Admin soft-delete without password.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    fun adminDeleteUser(@PathVariable id: Long): ResponseEntity<Map<String, String>> {
        userService.adminDeactivateUser(id)
        return ResponseEntity.ok(mapOf("message" to "User deactivated successfully"))
    }

    @Operation(summary = "Search Users", description = "Admin search by username or email.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search")
    fun searchUsers(
        @Parameter(description = "Search query") @RequestParam query: String,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<UserDto>> {
        if (query.isBlank()) throw BadRequestException("Query cannot be empty")
        val results = userService.searchByUsername(query, pageable)
        return ResponseEntity.ok(results.map { it.toDto() })
    }
}