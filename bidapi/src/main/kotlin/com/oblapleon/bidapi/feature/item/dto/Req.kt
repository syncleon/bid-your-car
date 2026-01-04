package com.oblapleon.bidapi.feature.item.dto

import jakarta.validation.constraints.*
import java.math.BigDecimal

/**
 * DTO for creating a new car listing.
 * Includes strict validation for VIN and price.
 */
data class ItemCreateRequest(
    @field:NotBlank(message = "Make is required")
    val make: String,

    @field:NotBlank(message = "Model is required")
    val model: String,

    @field:NotBlank(message = "VIN is required")
    @field:Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    val vin: String,

    @field:NotBlank(message = "Location is required")
    val location: String,

    val engine: String? = null,
    val drivetrain: String? = null,
    val transmission: String? = null,
    val bodyStyle: String? = null,
    val exteriorColor: String? = null,
    val interiorColor: String? = null,
    val sellerType: String? = null,

    @field:DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
    val buyNowPrice: BigDecimal? = null
)

/**
 * DTO for updating existing listings.
 * All fields are optional to allow partial updates.
 */
data class ItemUpdateRequest(
    val make: String? = null,
    val model: String? = null,
    val location: String? = null,
    val engine: String? = null,
    val drivetrain: String? = null,
    val transmission: String? = null,
    val bodyStyle: String? = null,
    val exteriorColor: String? = null,
    val interiorColor: String? = null,
    val sellerType: String? = null,

    @field:DecimalMin(value = "0.0", inclusive = true)
    val buyNowPrice: BigDecimal? = null
)