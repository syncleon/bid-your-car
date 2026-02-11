package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class AuctionDto(
    val id: UUID,
    val item: ItemDto,
    val status: AuctionStatus,
    val startTime: Instant,
    val endTime: Instant,

    // Financials
    val startPrice: BigDecimal,
    val currentPrice: BigDecimal, // Highest bid or start price
    val minBidIncrement: BigDecimal,
    val reservePrice: BigDecimal?,
    val isReserveMet: Boolean,

    // Stats
    val bidCount: Int,

    // Relationships
    val winnerId: Long?
)