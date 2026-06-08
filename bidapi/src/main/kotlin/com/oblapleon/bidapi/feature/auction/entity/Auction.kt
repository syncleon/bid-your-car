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
        Index(name = "idx_auction_status_end", columnList = "status, end_time"),
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

    @Version
    var version: Long = 0L,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    var item: Item,

    @Column(name = "start_price", nullable = false, precision = 19, scale = 2)
    var startPrice: BigDecimal,

    // Inherited from Item at the time of creation
    @Column(name = "reserve_price", precision = 19, scale = 2)
    var reservePrice: BigDecimal? = null,

    // Inherited from Item
    @Column(name = "is_no_reserve", nullable = false)
    var isNoReserve: Boolean = false,

    @Column(name = "min_bid_increment", nullable = false, precision = 19, scale = 2)
    var minBidIncrement: BigDecimal = BigDecimal("10.00"),

    @Column(name = "current_price", nullable = false, precision = 19, scale = 2)
    var currentPrice: BigDecimal,

    @Column(name = "bid_count", nullable = false)
    var bidCount: Int = 0,

    @Column(name = "start_time", nullable = false)
    var startTime: Instant,

    @Column(name = "end_time", nullable = false)
    var endTime: Instant,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AuctionStatus = AuctionStatus.PENDING_APPROVAL,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_bid_id")
    var winningBid: Bid? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    var winnerUser: User? = null,

    @OneToMany(mappedBy = "auction", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @BatchSize(size = 20)
    @OrderBy("amount DESC")
    var bids: MutableList<Bid> = mutableListOf()

) : BaseEntity<UUID>() {

    val isReserveMet: Boolean
        get() = isNoReserve || reservePrice == null || currentPrice >= reservePrice!!

    val isLive: Boolean
        get() = status == AuctionStatus.ACTIVE &&
                Instant.now().isAfter(startTime) &&
                Instant.now().isBefore(endTime)
}