package com.oblapleon.bidapi.feature.bid.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(
    name = "bids",
    indexes = [
        Index(name = "idx_bid_auction_amount", columnList = "auction_id, amount DESC"),
        Index(name = "idx_bid_bidder_time", columnList = "bidder_id, bid_time DESC")
    ]
)
class Bid(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false, updatable = false)
    var auction: Auction,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bidder_id", nullable = false, updatable = false)
    var bidder: User,

    @Column(nullable = false, precision = 19, scale = 2, updatable = false)
    var amount: BigDecimal,

    @Column(name = "max_amount", nullable = false, precision = 19, scale = 2, updatable = false)
    var maxAmount: BigDecimal = amount,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: BidStatus = BidStatus.ACCEPTED,

    @Column(name = "bid_time", nullable = false, updatable = false)
    var bidTime: Instant = Instant.now(),

    @Column(name = "ip_address", length = 45, updatable = false)
    var ipAddress: String? = null

) : BaseEntity<UUID>() {
    init {
        require(amount > BigDecimal.ZERO) { "Bid amount must be positive" }
    }
}