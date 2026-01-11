package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.user.dto.UserDto
import java.math.BigDecimal
import java.util.*

data class ItemDto(
    val id: UUID,
    val make: String,
    val model: String,
    val vin: String,
    val location: String,
    val seller: UserDto,
    val engine: String?,
    val drivetrain: String?,
    val transmission: String?,
    val bodyStyle: String?,
    val exteriorColor: String?,
    val interiorColor: String?,
    val sellerType: String?,
    val buyNowPrice: BigDecimal?,
    val images: List<ItemImageDto> = emptyList()
)