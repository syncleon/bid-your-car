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

    val startPrice: BigDecimal,
    val currentPrice: BigDecimal,
    val minBidIncrement: BigDecimal,

    val isNoReserve: Boolean,
    val isReserveMet: Boolean,

    val bidCount: Int,
    val winnerId: Long?
)