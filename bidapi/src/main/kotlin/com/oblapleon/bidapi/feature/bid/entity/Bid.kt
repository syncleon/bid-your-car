package com.oblapleon.bidapi.feature.bid.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import java.math.BigDecimal
import java.sql.Types
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "bids", indexes = [
    Index(name = "idx_bid_auction_amount", columnList = "auction_id, amount"),
    Index(name = "idx_bid_bidder", columnList = "bidder_id")
])
class Bid(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auction_id", nullable = false)
    var auction: Auction,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bidder_id", nullable = false)
    var bidder: User,

    @Column(nullable = false, precision = 19, scale = 2)
    var amount: BigDecimal,

    @Column(nullable = false)
    var bidTime: LocalDateTime = LocalDateTime.now()

) : BaseEntity<UUID>()