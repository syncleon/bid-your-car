package com.oblapleon.bidapi.feature.auction.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.util.*

data class CreateAuctionDto(
    @field:NotNull(message = "Item ID is required")
    val itemId: UUID,

    @field:NotNull(message = "Start time is required")
    @field:Future(message = "Start time must be in the future")
    val startTime: Instant,

    @field:NotNull(message = "End time is required")
    @field:Future(message = "End time must be in the future")
    val endTime: Instant,

    @field:NotNull(message = "Starting bid is required")
    @field:DecimalMin(value = "0.01", inclusive = true, message = "Starting price must be at least 0.01")
    val startPrice: BigDecimal,
    
    val isNoReserve: Boolean = false,
    
    @field:DecimalMin(value = "0.0", inclusive = false, message = "Reserve price must be greater than zero")
    val reservePrice: BigDecimal? = null
)