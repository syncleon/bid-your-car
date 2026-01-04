package com.oblapleon.bidapi.common.mapper

import com.oblapleon.bidapi.feature.item.dto.ItemCreateRequest
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.user.dto.RoleDto
import com.oblapleon.bidapi.feature.user.dto.UserDto
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User

fun Role.toDto(): RoleDto = RoleDto(name = name)

fun User.toDto(): UserDto =
    UserDto(
        id = id!!,
        username = username,
        email = email,
        roles = roles.map { it.toDto() }.toSet()
    )

/**
 * Maps the Entity to a Response DTO.
 */
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
    buyNowPrice = this.buyNowPrice
)

/**
 * Maps the Create Request to an Entity.
 * We explicitly set id = null so JPA treats this as a new record.
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
)

