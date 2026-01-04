package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.mapper.toDto
import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemUpdateRequest
import com.oblapleon.bidapi.feature.item.service.ItemService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/items")
@Tag(name = "Items", description = "Car listing management APIs")
class ItemController(
    private val itemService: ItemService,
    private val authHelper: AuthorizationHelper
) : BaseController() {

    @Operation(summary = "List a new car")
    @PostMapping
    fun createItem(@Valid @RequestBody request: ItemCreateRequest) = handleRequest {
        val user = authHelper.getCurrentUser()
        itemService.create(user, request).toDto()
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

    @GetMapping
    fun getAllItems() = handleRequest { itemService.findAll().map { it.toDto() } }
    @GetMapping("/{id}")
    fun getItemById(@PathVariable id: UUID) = handleRequest { itemService.findById(id).toDto() }
}