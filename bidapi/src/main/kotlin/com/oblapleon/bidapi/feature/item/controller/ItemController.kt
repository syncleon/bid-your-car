package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.dto.toDto
import com.oblapleon.bidapi.feature.item.service.ItemService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
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
) : BaseController() {

    @Operation(summary = "List a new car")
    @PostMapping
    fun createItem(@Valid @RequestBody request: ItemCreateRequest) = handleRequest {
        val user = authHelper.getCurrentUser()
        val createdItem = itemService.create(user, request)
        createdItem.toDto()
    }

    @Operation(summary = "Update a car listing")
    @PutMapping("/{id}")
    fun updateItem(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ItemUpdateRequest
    ) = handleRequest {
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)
        itemService.update(id, request).toDto()
    }

    @Operation(summary = "Delete a car listing")
    @DeleteMapping("/{id}")
    fun deleteItem(@PathVariable id: UUID) = handleRequest {
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)

        itemService.delete(id)
        null
    }

    @Operation(summary = "Get my car listings")
    @GetMapping("/me")
    fun getMyItems() = handleRequest {
        val user = authHelper.getCurrentUser()
        itemService.findBySeller(user.id!!).map { it.toDto() }
    }

    @Operation(summary = "Get all active listings")
    @GetMapping
    fun getAllItems() = handleRequest {
        itemService.findAll().map { it.toDto() }
    }

    @Operation(summary = "Get specific listing details")
    @GetMapping("/{id}")
    fun getItemById(@PathVariable id: UUID) = handleRequest {
        itemService.findById(id).toDto()
    }

    @Operation(summary = "Upload an image for a car")
    @PostMapping(
        value = ["/{id}/images"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadItemImage(
        @PathVariable id: UUID,
        @RequestParam("file") file: MultipartFile
    ) = handleRequest {
        val item = itemService.findById(id)
        authHelper.checkOwnerOrAdmin(item.seller.id!!)
        itemService.uploadImage(id, file).toDto()
    }

    @Operation(summary = "Delete an image")
    @DeleteMapping("/images/{imageId}")
    fun deleteItemImage(@PathVariable imageId: UUID) = handleRequest {
        val user = authHelper.getCurrentUser()
        // Service handles ownership check specifically for the image
        itemService.deleteImage(imageId, user.id!!)
        null
    }
}