package com.oblapleon.bidapi.feature.auction.event

import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Published after a bid is successfully committed to the database.
 *
 * Contains only scalar/serializable values captured INSIDE the transaction,
 * before the Hibernate session closes. This prevents [org.hibernate.LazyInitializationException]
 * in @Async listeners and serialization failures when storing to the Redis cache.
 *
 * Do NOT carry live JPA entities in events consumed after transaction commit.
 */
data class BidPlacedEvent(
    // Auction snapshot
    val auctionId: UUID,
    val auctionCurrentPrice: BigDecimal,
    val auctionBidCount: Int,
    val auctionEndTime: Instant,

    // Item snapshot (resolved while Hibernate session is open)
    val itemYear: Int,
    val itemMake: String,
    val itemModel: String,

    // Bid snapshot
    val bidId: UUID,
    val bidAmount: BigDecimal,
    val bidTime: Instant,
    val bidderUsername: String,
    val bidderId: Long
)
