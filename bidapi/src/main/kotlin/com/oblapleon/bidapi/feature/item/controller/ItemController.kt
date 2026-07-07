package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.item.dto.*
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.service.ItemService
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
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.CacheEvict
import java.util.UUID

@RestController
@RequestMapping("/api/v1/items")
@Tag(name = "Items (Inventory)", description = "Private vehicle inventory management for sellers")
class ItemController(
    private val itemService: ItemService,
    private val authorizationHelper: AuthorizationHelper
) {

    @Operation(summary = "Get My Inventory", description = "Get all items listed by the current authenticated user.")
    @GetMapping("/me")
    fun getMyItems(
        @PageableDefault(size = 20, sort = ["createdDate"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<ItemDto>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val items = itemService.findAllBySellerId(currentUser.id!!, pageable)
        return ResponseEntity.ok(items.map { it.toDto() })
    }

    @Operation(summary = "Get Item Details", description = "Get details of a specific item. You must be the owner or an Admin.")
    @Cacheable(value = ["items"], key = "#id")
    @GetMapping("/{id}")
    fun getItemById(@PathVariable id: UUID): ResponseEntity<ItemDto> {
        val item = itemService.findById(id)
        return ResponseEntity.ok(item.toDto())
    }

    @Operation(summary = "Add to Inventory", description = "Create a new vehicle listing draft.")
    @PostMapping
    fun createItem(
        @Valid @RequestBody request: ItemCreateRequest
    ): ResponseEntity<ItemDto> {
        val item = itemService.create(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(item.toDto())
    }

    @Operation(summary = "Update Inventory Item", description = "Update details of an existing listing.")
    @CacheEvict(value = ["items"], key = "#id")
    @PutMapping("/{id}")
    fun updateItem(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ItemUpdateRequest
    ): ResponseEntity<ItemDto> {
        val updatedItem = itemService.update(id, request)
        return ResponseEntity.ok(updatedItem.toDto())
    }

    @Operation(summary = "Delete Item", description = "Permanently remove an item and its images from inventory.")
    @CacheEvict(value = ["items"], key = "#id")
    @DeleteMapping("/{id}")
    fun deleteItem(
        @PathVariable id: UUID
    ): ResponseEntity<Map<String, String>> {
        itemService.delete(id)
        return ResponseEntity.ok(mapOf("message" to "Item deleted successfully"))
    }

    @Operation(summary = "Admin Reset Item Status", description = "Force reset an item to DRAFT if it is stuck.")
    @CacheEvict(value = ["items"], key = "#id")
    @PatchMapping("/admin/{id}/reset")
    fun adminResetItemStatus(
        @PathVariable id: UUID
    ): ResponseEntity<ItemDto> {
        val item = itemService.adminResetStatus(id)
        return ResponseEntity.ok(item.toDto())
    }

    @Operation(summary = "Upload Image", description = "Upload a categorized photo for a vehicle.")
    @CacheEvict(value = ["items"], key = "#id")
    @PostMapping(
        value = ["/{id}/images"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadItemImage(
        @PathVariable id: UUID,
        @Parameter(description = "Image file (JPG/PNG)") @RequestParam("file") file: MultipartFile,
        @Parameter(description = "Image Category (MAIN, EXTERIOR, INTERIOR, ENGINE, SERVICE, OTHER)")
        @RequestParam(defaultValue = "OTHER") category: ImageCategory
    ): ResponseEntity<ItemImageDto> {
        val image = itemService.uploadImage(id, file, category)
        return ResponseEntity.status(HttpStatus.CREATED).body(image.toDto())
    }
}