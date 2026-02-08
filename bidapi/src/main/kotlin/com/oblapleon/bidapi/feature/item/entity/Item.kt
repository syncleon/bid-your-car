package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import org.hibernate.annotations.JdbcTypeCode
import java.sql.Types
import java.util.UUID

@Entity
@Table(
    name = "items",
    indexes = [
        Index(name = "idx_item_make_model", columnList = "make, model"),
        Index(name = "idx_item_year", columnList = "year"),
        Index(name = "idx_item_seller_id", columnList = "seller_id")
    ]
)
class Item(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    @Column(nullable = false)
    var year: Int,

    @Column(nullable = false, length = 50)
    var make: String,

    @Column(nullable = false, length = 50)
    var model: String,

    @Column(nullable = false, unique = true, length = 17)
    var vin: String,

    @Column(nullable = false)
    var location: String,

    @Column(nullable = false)
    var mileage: Int,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "engine")
    var engine: String? = null,

    @Column(name = "drivetrain")
    var drivetrain: String? = null,

    @Column(name = "transmission")
    var transmission: String? = null,

    @Column(name = "body_style")
    var bodyStyle: String? = null,

    @Column(name = "exterior_color")
    var exteriorColor: String? = null,

    @Column(name = "interior_color")
    var interiorColor: String? = null,

    @Column(name = "seller_type")
    var sellerType: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    var seller: User,

    @OneToMany(mappedBy = "item", cascade = [CascadeType.ALL], orphanRemoval = true)
    @BatchSize(size = 20)
    var images: MutableSet<ItemImage> = mutableSetOf(),

    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @BatchSize(size = 20)
    var auctions: MutableSet<Auction> = mutableSetOf()

) : BaseEntity<UUID>() {

    val activeAuctionId: UUID?
        get() = auctions.find { it.status == AuctionStatus.ACTIVE }?.id

    val currentStatus: AuctionStatus?
        get() = auctions.find { it.status == AuctionStatus.ACTIVE }?.status
            ?: auctions.maxByOrNull { it.endTime }?.status

    val isActive: Boolean get() = currentStatus == AuctionStatus.ACTIVE
    val isSold: Boolean get() = currentStatus == AuctionStatus.SOLD
    val isAvailable: Boolean
        get() = currentStatus == null ||
                currentStatus == AuctionStatus.REJECTED ||
                currentStatus == AuctionStatus.EXPIRED ||
                currentStatus == AuctionStatus.CANCELLED
}