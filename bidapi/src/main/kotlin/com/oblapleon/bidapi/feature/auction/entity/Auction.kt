package com.oblapleon.bidapi.feature.auction.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(
    name = "auctions",
    indexes = [
        // Composite index for "Ending Soon" queries (Status + EndTime)
        Index(name = "idx_auction_status_end", columnList = "status, end_time"),
        // Composite index for "Just Listed" queries (Status + StartTime)
        Index(name = "idx_auction_status_start", columnList = "status, start_time"),
        Index(name = "idx_auction_item", columnList = "item_id"),
        Index(name = "idx_auction_winner", columnList = "winner_id")
    ]
)
class Auction(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    // Optimistic locking to prevent concurrent bid race conditions
    @Version
    var version: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    var item: Item,

    @Column(name = "start_price", nullable = false, precision = 19, scale = 2)
    var startPrice: BigDecimal,

    @Column(name = "reserve_price", precision = 19, scale = 2)
    var reservePrice: BigDecimal? = null,

    @Column(name = "min_bid_increment", nullable = false, precision = 19, scale = 2)
    var minBidIncrement: BigDecimal = BigDecimal("10.00"),

    /**
     * The current highest bid amount (or start price if no bids).
     * Updated automatically when a bid is placed.
     */
    @Column(name = "current_price", nullable = false, precision = 19, scale = 2)
    var currentPrice: BigDecimal,

    /**
     * Persisted counter for bids.
     * Prevents loading the entire 'bids' collection just to show "5 bids" on a card.
     */
    @Column(name = "bid_count", nullable = false)
    var bidCount: Int = 0,

    @Column(name = "start_time", nullable = false)
    var startTime: Instant,

    @Column(name = "end_time", nullable = false)
    var endTime: Instant,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AuctionStatus = AuctionStatus.PENDING_APPROVAL,

    /**
     * Link to the winning bid for audit trail.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_bid_id")
    var winningBid: Bid? = null,

    /**
     * Denormalized winner user for fast querying ("My Wins").
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    var winnerUser: User? = null,

    @OneToMany(mappedBy = "auction", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @BatchSize(size = 20)
    @OrderBy("amount DESC")
    var bids: MutableList<Bid> = mutableListOf()

) : BaseEntity<UUID>() {

    val isReserveMet: Boolean
        get() = reservePrice == null || currentPrice >= reservePrice!!

    val isLive: Boolean
        get() = status == AuctionStatus.ACTIVE &&
                Instant.now().isAfter(startTime) &&
                Instant.now().isBefore(endTime)
}