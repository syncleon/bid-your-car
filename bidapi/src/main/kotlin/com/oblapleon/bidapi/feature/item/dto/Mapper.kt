package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.user.dto.toDto


private const val CDN_BASE_URL = "https://ik.imagekit.io/lfv0hg4nv"

fun Item.toDto(): ItemDto = ItemDto(
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
    titleStatus = this.titleStatus,
    buyNowPrice = this.buyNowPrice,
    images = this.images.map { it.toDto() }
)

fun ItemImage.toDto(): ItemImageDto {
    val filename = this.url.substringAfterLast("/")
    val cdnPath = "${CDN_BASE_URL}/$filename"

    return ItemImageDto(
        id = this.id!!,
        originalUrl = this.url,
        thumbnailUrl = "$cdnPath?tr=w-400,h-300,f-auto,q-80",
        previewUrl = "$cdnPath?tr=w-1000,f-auto,q-90",
        fullHdUrl = "$cdnPath?tr=f-auto,q-95"
    )
}