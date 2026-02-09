package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.user.dto.toDto
import java.util.UUID

fun Item.toDto(): ItemDto {
    return ItemDto(
        id = this.id!!,
        year = this.year,
        make = this.make,
        model = this.model,
        vin = this.vin,
        location = this.location,
        mileage = this.mileage,
        description = this.description,
        seller = this.seller.toDto(),
        engine = this.engine,
        drivetrain = this.drivetrain,
        transmission = this.transmission,
        bodyStyle = this.bodyStyle,
        exteriorColor = this.exteriorColor,
        interiorColor = this.interiorColor,
        sellerType = this.sellerType,
        images = this.images.map { it.toDto() },
        activeAuctionId = this.activeAuctionId,
        auctionStatus = this.currentStatus,
        isActive = this.isActive,
        isSold = this.isSold,
        isAvailable = this.isAvailable
    )
}

fun ItemImage.toDto(): ItemImageDto {
    val safeUrl = this.url ?: ""

    // We simply use the original URL for all fields.
    // Since we aren't using ImageKit, we can't auto-resize for thumbnails,
    // so we return the full URL for everything.
    return ItemImageDto(
        id = this.id ?: UUID.randomUUID(),
        originalUrl = safeUrl,
        thumbnailUrl = safeUrl,
        previewUrl = safeUrl,
        fullHdUrl = safeUrl
    )
}