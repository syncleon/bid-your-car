package com.oblapleon.bidapi.feature.item.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.user.dto.UserDto
import java.io.Serializable
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
    val thumbnailUrl: String?, // <--- Added for performance (List views)

    // Grouped specs for cleaner frontend handling
    val engine: String?,
    val drivetrain: String?,
    val transmission: String?,
    val bodyStyle: String?,
    val exteriorColor: String?,
    val interiorColor: String?,
    val sellerType: String?,

    val images: List<ItemImageDto> = emptyList()
) : Serializable // <-- Added here

data class ItemImageDto(
    val id: UUID,
    val url: String,
    val sortOrder: Int
) : Serializable // <-- Added here