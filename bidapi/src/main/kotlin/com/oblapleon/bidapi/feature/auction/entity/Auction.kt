package com.oblapleon.bidapi.feature.auction.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*
import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil

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

    fun processBidRequest(bidder: User, maxAmount: BigDecimal, now: Instant): List<Bid> {
        val minRequired = if (bidCount == 0) startPrice else currentPrice.add(BidIncrementUtil.getDynamicBidIncrement(currentPrice))
        val currentWinnerId = winningBid?.bidder?.id
        val currentMax = winningBid?.maxAmount ?: BigDecimal.ZERO

        if (currentWinnerId == bidder.id) {
            if (maxAmount <= currentMax) {
                throw BadRequestException("Your new max bid must be higher than your current max bid ($currentMax).")
            }
            return listOf(recordBidInternal(bidder, currentPrice, maxAmount, now))
        }

        if (maxAmount < minRequired) {
            throw BadRequestException("Bid amount too low. Minimum required: $minRequired")
        }

        if (bidCount == 0) {
            return listOf(recordBidInternal(bidder, startPrice, maxAmount, now))
        }

        if (maxAmount <= currentMax) {
            val prevWinner = winningBid!!.bidder
            val bobBid = recordBidInternal(bidder, maxAmount, maxAmount, now)
            val nextIncrement = maxAmount.add(BidIncrementUtil.getDynamicBidIncrement(maxAmount))
            val newPriceForA = if (currentMax >= nextIncrement) nextIncrement else currentMax
            val aliceBid = recordBidInternal(prevWinner, newPriceForA, currentMax, now.plusMillis(1))
            return listOf(bobBid, aliceBid)
        } else {
            val prevWinner = winningBid!!.bidder
            val bobBid = recordBidInternal(prevWinner, currentMax, currentMax, now)
            val nextIncrement = currentMax.add(BidIncrementUtil.getDynamicBidIncrement(currentMax))
            val newPriceForB = if (maxAmount >= nextIncrement) nextIncrement else maxAmount
            val aliceBid = recordBidInternal(bidder, newPriceForB, maxAmount, now.plusMillis(1))
            return listOf(bobBid, aliceBid)
        }
    }

    private fun recordBidInternal(bidder: User, amount: BigDecimal, maxAmount: BigDecimal, now: Instant): Bid {
        val secondsRemaining = ChronoUnit.SECONDS.between(now, endTime)
        if (secondsRemaining < 120) endTime = now.plus(120, ChronoUnit.SECONDS)

        val bid = Bid(
            auction = this,
            bidder = bidder,
            amount = amount,
            bidTime = now,
            maxAmount = maxAmount
        )
        currentPrice = amount
        bidCount += 1
        winningBid = bid
        return bid
    }
}