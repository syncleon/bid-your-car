package com.oblapleon.bidapi.feature.bid.dto

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDateTime
import java.util.UUID

data class BidDto(
    val id: UUID,
    val auctionId: UUID,
    val bidderId: Long,
    val bidderName: String,
    val amount: BigDecimal,
    val bidTime: Instant
)