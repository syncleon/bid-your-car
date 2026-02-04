package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.item.dto.ItemDto
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class AuctionDto(
    val id: UUID,
    val item: ItemDto,
    val startTime: Instant,
    val endTime: Instant,
    val status: AuctionStatus,
    val startPrice: BigDecimal,
    val minBidIncrement: BigDecimal,
    val currentHighestBid: BigDecimal?,
    val bidCount: Int,
    val isReserveMet: Boolean,
    val winnerId: Long?
)