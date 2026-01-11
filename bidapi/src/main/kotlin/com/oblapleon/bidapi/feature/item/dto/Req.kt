package com.oblapleon.bidapi.feature.item.dto

import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.util.UUID

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

data class ItemImageDto(
    /**
     * Unique ID of the image record in your database.
     * Useful if the user wants to delete this specific image.
     */
    val id: UUID,

    /**
     * The raw S3 URL (e.g., https://s3.amazonaws.com/...).
     * Usually kept for internal reference or admin tools.
     * The frontend typically won't display this directly because it's not optimized/public.
     */
    val originalUrl: String,

    /**
     * Small, highly optimized image for lists and search results.
     * Example: 400x300px, Quality 80%.
     * Loads instantly on mobile data.
     */
    val thumbnailUrl: String,

    /**
     * Medium-large image for the main car details page.
     * Example: 1000px width, Quality 90%.
     */
    val previewUrl: String,

    /**
     * Full resolution image for "Zoom" or "View Full Screen" features.
     * Optimized format (WebP/AVIF) but keeps original dimensions.
     */
    val fullHdUrl: String
)