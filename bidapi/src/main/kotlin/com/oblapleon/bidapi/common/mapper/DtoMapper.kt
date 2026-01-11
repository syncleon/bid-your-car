package com.oblapleon.bidapi.common.mapper

import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import com.oblapleon.bidapi.feature.item.dto.ItemImageDto
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.user.dto.RoleDto
import com.oblapleon.bidapi.feature.user.dto.UserDto
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

// ✅ CONFIG: Your ImageKit Base URL
// Make sure this matches your application.yml / ImageKit Dashboard
private const val CDN_BASE_URL = "https://ik.imagekit.io/lfv0hg4nv"

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto =
    UserDto(
        id = id!!,
        username = username,
        email = email,
        roles = roles.map { it.toDto() }.toSet()
    )

fun Item.toDto(): ItemDto = ItemDto(
    id = this.id!!,
    make = this.make,
    model = this.model,
    vin = this.vin,
    location = this.location,
    seller = this.seller.toDto(),
    engine = this.engine,
    drivetrain = this.drivetrain,
    transmission = this.transmission,
    bodyStyle = this.bodyStyle,
    exteriorColor = this.exteriorColor,
    interiorColor = this.interiorColor,
    sellerType = this.sellerType,
    buyNowPrice = this.buyNowPrice,

    // ✅ Map the list of images using the extension function below
    images = this.images.map { it.toDto() }
)

fun ItemImage.toDto(): ItemImageDto {
    val filename = this.url.substringAfterLast("/")
    val cdnPath = "$CDN_BASE_URL/$filename"

    return ItemImageDto(
        id = this.id!!,
        originalUrl = this.url,
        thumbnailUrl = "$cdnPath?tr=w-400,h-300,f-auto,q-80",
        previewUrl = "$cdnPath?tr=w-1000,f-auto,q-90",
        fullHdUrl = "$cdnPath?tr=f-auto,q-95"
    )
}

/**
 * Maps the Create Request to an Entity.
 */
fun ItemCreateRequest.toEntity(seller: User): Item = Item(
    id = null,
    make = this.make,
    model = this.model,
    vin = this.vin,
    location = this.location,
    seller = seller,
    engine = this.engine,
    drivetrain = this.drivetrain,
    transmission = this.transmission,
    bodyStyle = this.bodyStyle,
    exteriorColor = this.exteriorColor,
    interiorColor = this.interiorColor,
    sellerType = this.sellerType,
    buyNowPrice = this.buyNowPrice
    // Note: Images are usually uploaded separately after item creation,
    // so we don't map them here.
)