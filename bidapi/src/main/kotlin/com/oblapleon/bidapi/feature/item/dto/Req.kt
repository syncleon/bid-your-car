package com.oblapleon.bidapi.feature.item.dto

import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import jakarta.validation.constraints.*
import java.math.BigDecimal
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
    var mileage: Int,

    @field:Size(max = 5000, message = "Description is too long")
    val description: String? = null,

    val isModified: Boolean = false,
    val hasServiceHistory: Boolean = false,

    @field:Size(max = 255, message = "Value is too long")
    val titleStatus: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val fuelType: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val engine: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val drivetrain: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val transmission: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val bodyStyle: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val exteriorColor: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val interiorColor: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val sellerType: String? = null,

    @field:Min(value = 0, message = "Horsepower cannot be negative")
    val horsepower: Int? = null,

    @field:NotNull(message = "Condition grade is required")
    val condition: ConditionGrade,

    @field:Size(max = 5000, message = "Highlights is too long")
    val highlights: String? = null,
    @field:Size(max = 5000, message = "Known flaws is too long")
    val knownFlaws: String? = null,
    @field:Size(max = 5000, message = "Service history is too long")
    val recentServiceHistory: String? = null,
    @field:Size(max = 5000, message = "Other items is too long")
    val otherItemsIncluded: String? = null
)

data class ItemUpdateRequest(
    @field:Min(value = 1900, message = "Year must be valid")
    val year: Int? = null,
    val make: String? = null,
    val model: String? = null,
    
    @field:Size(min = 17, max = 17, message = "VIN must be exactly 17 characters")
    val vin: String? = null,
    
    val location: String? = null,
    @field:Min(value = 0, message = "Mileage cannot be negative")
    val mileage: Int? = null,
    @field:Size(max = 5000, message = "Description is too long")
    val description: String? = null,
    val isModified: Boolean? = null,
    val hasServiceHistory: Boolean? = null,

    @field:Size(max = 255, message = "Value is too long")
    val titleStatus: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val fuelType: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val engine: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val drivetrain: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val transmission: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val bodyStyle: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val exteriorColor: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val interiorColor: String? = null,

    @field:Size(max = 255, message = "Value is too long")
    val sellerType: String? = null,

    @field:Min(value = 0, message = "Horsepower cannot be negative")
    val horsepower: Int? = null,

    val condition: ConditionGrade? = null,

    @field:Size(max = 5000, message = "Highlights is too long")
    val highlights: String? = null,
    @field:Size(max = 5000, message = "Known flaws is too long")
    val knownFlaws: String? = null,
    @field:Size(max = 5000, message = "Service history is too long")
    val recentServiceHistory: String? = null,
    @field:Size(max = 5000, message = "Other items is too long")
    val otherItemsIncluded: String? = null,
    val keepImageIds: List<UUID>? = null
)