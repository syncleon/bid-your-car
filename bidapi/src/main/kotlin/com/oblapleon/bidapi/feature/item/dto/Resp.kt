package com.oblapleon.bidapi.feature.item.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.user.dto.UserDto
import java.io.Serializable
import java.math.BigDecimal
import java.util.*

data class ItemDto(
    val id: UUID,
    val status: ItemStatus,
    val year: Int,
    val make: String,
    val model: String,
    val vin: String,
    val location: String,
    val mileage: Int,
    val description: String?,
    @JsonIgnoreProperties("items")
    val seller: UserDto,
    val thumbnailUrl: String?,
    val fuelType: String?,
    val horsepower: Int?,
    val condition: ConditionGrade,
    val titleStatus: String?,
    val isModified: Boolean,
    val hasServiceHistory: Boolean,
    val reservePrice: BigDecimal?,
    val isNoReserve: Boolean,
    val engine: String?,
    val drivetrain: String?,
    val transmission: String?,
    val bodyStyle: String?,
    val exteriorColor: String?,
    val interiorColor: String?,
    val sellerType: String?,
    val images: List<ItemImageDto> = emptyList()
) : Serializable

data class ItemImageDto(
    val id: UUID,
    val url: String,
    val category: ImageCategory,
    val sortOrder: Int
) : Serializable