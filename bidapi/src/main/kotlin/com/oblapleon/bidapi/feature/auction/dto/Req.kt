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
    @field:DecimalMin(value = "0.0", inclusive = true)
    val startPrice: BigDecimal,

    @field:DecimalMin(value = "1.0", inclusive = true)
    val minBidIncrement: BigDecimal = BigDecimal("10.00")
)