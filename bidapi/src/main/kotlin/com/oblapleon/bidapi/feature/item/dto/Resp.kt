package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.user.dto.UserDto
import java.math.BigDecimal
import java.util.*

data class ItemDto(
    val id: UUID,
    val year: Int,
    val make: String,
    val model: String,
    val vin: String,
    val location: String,
    val mileage: Int,
    val description: String?,
    val seller: UserDto,
    val engine: String?,
    val drivetrain: String?,
    val transmission: String?,
    val bodyStyle: String?,
    val exteriorColor: String?,
    val interiorColor: String?,
    val sellerType: String?,
    val images: List<ItemImageDto> = emptyList(),
    val activeAuctionId: UUID?,
    val auctionStatus: AuctionStatus?,
    val isActive: Boolean,
    val isSold: Boolean,
    val isAvailable: Boolean
)