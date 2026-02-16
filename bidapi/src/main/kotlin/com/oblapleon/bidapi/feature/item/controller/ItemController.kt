package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.feature.item.dto.*
import com.oblapleon.bidapi.feature.item.service.ItemService
import com.oblapleon.bidapi.feature.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.UUID

@RestController
@RequestMapping("/api/v1/items")
@Tag(name = "Items", description = "Vehicle inventory management")
class ItemController(
    private val itemService: ItemService,
    private val userService: UserService
) {

    // ========================================================================
    //  PUBLIC ENDPOINTS
    // ========================================================================

    @Operation(summary = "Browse Items", description = "Get paginated list of available items.")
    @GetMapping
    fun getAllItems(
        @PageableDefault(size = 20, sort = ["createdDate"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<ItemDto>> {
        val items = itemService.findAllAvailable(pageable)
        return ResponseEntity.ok(items.map { it.toDto() })
    }

    @Operation(summary = "Get Item Details", description = "Get full details including specs and images.")
    @GetMapping("/{id}")
    fun getItemById(@PathVariable id: UUID): ResponseEntity<ItemDto> {
        val itemDto = itemService.getCachedItemDto(id)
        return ResponseEntity.ok(itemDto)
    }

    // ========================================================================
    //  PROTECTED ENDPOINTS
    // ========================================================================

    @Operation(summary = "Get My Listings", description = "Get all items listed by the current user.")
    @GetMapping("/me")
    fun getMyItems(
        @AuthenticationPrincipal username: String,
        @PageableDefault(size = 20, sort = ["createdDate"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<ItemDto>> {
        val user = userService.findByUsername(username)
        val items = itemService.findAllBySellerId(user.id!!, pageable)
        return ResponseEntity.ok(items.map { it.toDto() })
    }

    @Operation(summary = "List a New Car", description = "Create a new vehicle listing.")
    @PostMapping
    fun createItem(
        @AuthenticationPrincipal username: String,
        @Valid @RequestBody request: ItemCreateRequest
    ): ResponseEntity<ItemDto> {
        val user = userService.findByUsername(username)
        val item = itemService.create(user, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(item.toDto())
    }

    @Operation(summary = "Update Listing", description = "Update details of an existing listing.")
    @PutMapping("/{id}")
    fun updateItem(
        @AuthenticationPrincipal username: String,
        @PathVariable id: UUID,
        @Valid @RequestBody request: ItemUpdateRequest
    ): ResponseEntity<ItemDto> {
        val user = userService.findByUsername(username)
        // Service handles ownership check
        val updatedItem = itemService.update(id, user, request)
        return ResponseEntity.ok(updatedItem.toDto())
    }

    @Operation(summary = "Delete Listing", description = "Permanently remove listing and images.")
    @DeleteMapping("/{id}")
    fun deleteItem(
        @AuthenticationPrincipal username: String,
        @PathVariable id: UUID
    ): ResponseEntity<Map<String, String>> {
        val user = userService.findByUsername(username)
        // Service handles ownership check
        itemService.delete(id, user)
        return ResponseEntity.ok(mapOf("message" to "Item deleted successfully"))
    }

    // ========================================================================
    //  IMAGE MANAGEMENT
    // ========================================================================

    @Operation(summary = "Upload Image", description = "Upload a photo for a car.")
    @PostMapping(
        value = ["/{id}/images"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadItemImage(
        @AuthenticationPrincipal username: String,
        @PathVariable id: UUID,
        @Parameter(description = "Image file (JPG/PNG)") @RequestParam("file") file: MultipartFile
    ): ResponseEntity<ItemImageDto> {
        val user = userService.findByUsername(username)
        val image = itemService.uploadImage(id, user, file)
        return ResponseEntity.status(HttpStatus.CREATED).body(image.toDto())
    }
}