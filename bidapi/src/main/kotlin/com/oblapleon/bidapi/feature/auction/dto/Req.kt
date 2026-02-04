package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import com.oblapleon.bidapi.feature.item.dto.toDto
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

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
    val startingBid: BigDecimal,

    @field:DecimalMin(value = "0.0", inclusive = true)
    val reservePrice: BigDecimal? = null,

    @field:DecimalMin(value = "1.0", inclusive = true)
    val minBidIncrement: BigDecimal = BigDecimal("50.00")
)
