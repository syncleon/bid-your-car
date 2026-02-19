package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.user.dto.toDto

fun Item.toDto(): ItemDto {
    return ItemDto(
        id = this.id!!,
        status = this.status,
        year = this.year,
        make = this.make,
        model = this.model,
        vin = this.vin,
        location = this.location,
        mileage = this.mileage,
        description = this.description,
        thumbnailUrl = this.thumbnailUrl,
        seller = this.seller.toDto(),
        fuelType = this.fuelType,
        horsepower = this.horsepower,
        condition = this.condition,
        titleStatus = this.titleStatus,
        isModified = this.isModified,
        hasServiceHistory = this.hasServiceHistory,
        reservePrice = this.reservePrice,
        isNoReserve = this.isNoReserve,
        engine = this.engine,
        drivetrain = this.drivetrain,
        transmission = this.transmission,
        bodyStyle = this.bodyStyle,
        exteriorColor = this.exteriorColor,
        interiorColor = this.interiorColor,
        sellerType = this.sellerType,

        images = this.images.map { it.toDto() }.sortedBy { it.sortOrder }
    )
}

fun ItemImage.toDto(): ItemImageDto {
    return ItemImageDto(
        id = this.id!!,
        url = this.url,
        category = this.category,
        sortOrder = this.sortOrder
    )
}