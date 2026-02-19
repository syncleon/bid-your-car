package com.oblapleon.bidapi.feature.bid.dto

import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class BidNotificationDto(
    val auctionId: UUID,
    val newPrice: BigDecimal,
    val bidCount: Int,
    val bidderUsername: String,
    val bidTime: Instant,
    val newEndTime: Instant
)