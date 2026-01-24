package com.oblapleon.bidapi.feature.auction.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import java.math.BigDecimal
import java.sql.Types
import java.time.LocalDateTime
import java.util.*

@Table(name = "auctions")
@Entity
class Auction(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(updatable = false, nullable = false)
    var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    var item: Item,

    @Column(nullable = false, precision = 19, scale = 2)
    var startPrice: BigDecimal,

    @Column(name = "reserve_price", precision = 19, scale = 2)
    var reservePrice: BigDecimal? = null,

    @Column(name = "min_bid_increment", precision = 19, scale = 2)
    var minBidIncrement: BigDecimal = BigDecimal("10.00"),

    @Column(nullable = false, precision = 19, scale = 2)
    var currentHighestBid: BigDecimal,

    @Column(nullable = false)
    var startTime: LocalDateTime,

    @Column(nullable = false)
    var endTime: LocalDateTime,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: AuctionStatus = AuctionStatus.ACTIVE,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    var winnerUser: User? = null,

    @OneToMany(mappedBy = "auction", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @OrderBy("amount DESC")
    var bids: MutableList<Bid> = mutableListOf()

) : BaseEntity() {
    fun isReserveMet(): Boolean {
        val reserve = reservePrice ?: return true
        return currentHighestBid >= reserve
    }
}