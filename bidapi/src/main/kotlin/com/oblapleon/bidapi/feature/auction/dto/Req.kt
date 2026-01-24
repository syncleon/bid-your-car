package com.oblapleon.bidapi.feature.auction.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID


data class CreateAuctionDto(
    @field:NotNull(message = "Item ID is required")
    var itemId: UUID,
    @field:NotNull(message = "Start time is required")
    @field:Future(message = "Start time must be in the future")
    var startTime: Instant,

    @field:NotNull(message = "End time is required")
    @field:Future(message = "End time must be in the future")
    var endTime: Instant,

    @field:NotNull(message = "Starting bid price is required")
    @field:DecimalMin(value = "0.0", inclusive = true, message = "Starting bid cannot be negative")
    var startingBid: BigDecimal,

    @field:DecimalMin(value = "0.0", inclusive = true, message = "Reserve price cannot be negative")
    val reservePrice: BigDecimal? = null,

    @field:DecimalMin(value = "1.0", inclusive = true, message = "Minimum increment must be at least 1.0")
    val minBidIncrement: BigDecimal = BigDecimal("50.00")
)