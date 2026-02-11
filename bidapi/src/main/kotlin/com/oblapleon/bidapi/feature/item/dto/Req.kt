package com.oblapleon.bidapi.feature.item.dto

import jakarta.validation.constraints.*
import java.util.UUID

data class ItemCreateRequest(
    @field:NotNull(message = "Year is required")
    @field:Min(value = 1900, message = "Year must be valid")
    val year: Int,

    @field:NotBlank(message = "Make is required")
    val make: String,

    @field:NotBlank(message = "Model is required")
    val model: String,

    @field:NotBlank(message = "VIN is required")
    @field:Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    val vin: String,

    @field:NotBlank(message = "Location is required")
    val location: String,

    @field:NotNull(message = "Mileage is required")
    @field:Min(value = 0, message = "Mileage cannot be negative")
    val mileage: Int,

    @field:Size(max = 5000, message = "Description is too long")
    val description: String? = null,

    val engine: String? = null,
    val drivetrain: String? = null,
    val transmission: String? = null,
    val bodyStyle: String? = null,
    val exteriorColor: String? = null,
    val interiorColor: String? = null,
    val sellerType: String? = null
)

/**
 * DTO for updating existing listings.
 */
data class ItemUpdateRequest(
    @field:Min(value = 1900, message = "Year must be valid")
    val year: Int? = null,

    val make: String? = null,
    val model: String? = null,
    val location: String? = null,

    @field:Min(value = 0, message = "Mileage cannot be negative")
    val mileage: Int? = null,

    @field:Size(max = 5000, message = "Description is too long")
    val description: String? = null,

    val engine: String? = null,
    val drivetrain: String? = null,
    val transmission: String? = null,
    val bodyStyle: String? = null,
    val exteriorColor: String? = null,
    val interiorColor: String? = null,
    val sellerType: String? = null,

    // IDs of images to keep. Anything NOT in this list is deleted.
    val keepImageIds: List<UUID>? = null
)