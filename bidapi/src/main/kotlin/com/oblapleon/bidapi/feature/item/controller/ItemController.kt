package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.item.dto.*
import com.oblapleon.bidapi.feature.item.service.ItemService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

@RestController
@RequestMapping("/api/v1/items")
@Tag(name = "Items", description = "Car listing management APIs")
class ItemController(
    private val itemService: ItemService,
    private val authHelper: AuthorizationHelper,
) {

    @Operation(summary = "Get all active listings")
    @GetMapping
    fun getAllItems(
        @PageableDefault(size = 20, sort = ["createdDate"]) pageable: Pageable
    ): Page<ItemDto> {
        return itemService.findAll(pageable).map { it.toDto() }
    }

    @Operation(summary = "Get specific listing details")
    @GetMapping("/{id}")
    fun getItemById(@PathVariable id: UUID): ItemDto {
        return itemService.findById(id).toDto()
    }

    @Operation(summary = "Get my car listings")
    @GetMapping("/me")
    fun getMyItems(
        @PageableDefault(size = 20, sort = ["createdDate"]) pageable: Pageable
    ): Page<ItemDto> {
        val user = authHelper.getCurrentUser()
        return itemService.findBySeller(user.id!!, pageable).map { it.toDto() }
    }

    @Operation(summary = "List a new car")
    @PostMapping
    fun createItem(@Valid @RequestBody request: ItemCreateRequest): ItemDto {
        val user = authHelper.getCurrentUser()
        return itemService.create(user, request).toDto()
    }

    @Operation(summary = "Update a car listing")
    @PutMapping("/{id}")
    fun updateItem(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ItemUpdateRequest
    ): ItemDto {
        // We verify ownership *before* calling update service to be safe
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)

        return itemService.update(id, request).toDto()
    }

    @Operation(summary = "Delete a car listing")
    @DeleteMapping("/{id}")
    fun deleteItem(@PathVariable id: UUID) {
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)
        itemService.delete(id)
    }

    @Operation(summary = "Upload an image for a car")
    @PostMapping(
        value = ["/{id}/images"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadItemImage(
        @PathVariable id: UUID,
        @RequestParam("file") file: MultipartFile
    ): ItemImageDto {
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)
        return itemService.uploadImage(id, file).toDto()
    }

    @Operation(summary = "Delete an image")
    @DeleteMapping("/images/{imageId}")
    fun deleteItemImage(@PathVariable imageId: UUID) {
        val user = authHelper.getCurrentUser()
        itemService.deleteImage(imageId, user.id!!)
    }
}