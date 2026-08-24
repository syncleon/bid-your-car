package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.BatchSize
import java.util.*

@Entity
@Table(
    name = "items",
    indexes = [
        Index(name = "idx_item_make_model", columnList = "make, model"),
        Index(name = "idx_item_status", columnList = "status"),
        Index(name = "idx_item_seller_id", columnList = "seller_id"),
        Index(name = "idx_item_condition", columnList = "condition"),
        Index(name = "idx_item_fuel_type", columnList = "fuel_type")
    ]
)
class Item(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    @Version
    var version: Long = 0L,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ItemStatus = ItemStatus.DRAFT,

    @Column(name = "production_year", nullable = false)
    var year: Int,

    @Column(nullable = false, length = 50)
    var make: String,

    @Column(nullable = false, length = 50)
    var model: String,

    @Column(nullable = false, length = 17)
    var vin: String,

    @Column(nullable = false)
    var location: String,

    @Column(nullable = false)
    var mileage: Int,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "thumbnail_url")
    var thumbnailUrl: String? = null,

    @Column(name = "fuel_type", length = 30)
    var fuelType: String? = null,

    @Column(name = "horsepower")
    var horsepower: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var condition: ConditionGrade = ConditionGrade.GOOD,

    @Column(name = "title_status", length = 50)
    var titleStatus: String? = null,

    @Column(name = "is_modified")
    var isModified: Boolean = false,

    @Column(name = "has_service_records", nullable = false)
    var hasServiceHistory: Boolean = false,

    @Column(name = "reserve_price", precision = 19, scale = 2)
    var reservePrice: java.math.BigDecimal? = null,

    @Column(name = "is_no_reserve")
    var isNoReserve: Boolean = false,

    @Column(length = 50)
    var engine: String? = null,

    @Column(length = 50)
    var drivetrain: String? = null,

    @Column(length = 50)
    var transmission: String? = null,

    @Column(name = "body_style", length = 50)
    var bodyStyle: String? = null,

    @Column(name = "exterior_color", length = 30)
    var exteriorColor: String? = null,

    @Column(name = "interior_color", length = 30)
    var interiorColor: String? = null,

    @Column(name = "seller_type", length = 20)
    var sellerType: String? = null,

    @Column(columnDefinition = "TEXT")
    var highlights: String? = null,

    @Column(name = "known_flaws", columnDefinition = "TEXT")
    var knownFlaws: String? = null,

    @Column(name = "recent_service_history", columnDefinition = "TEXT")
    var recentServiceHistory: String? = null,

    @Column(name = "other_items_included", columnDefinition = "TEXT")
    var otherItemsIncluded: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    var seller: User,

    @OneToMany(mappedBy = "item", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    var images: MutableList<ItemImage> = mutableListOf(),

    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY)
    var auctions: MutableSet<Auction> = mutableSetOf(),

    @Column(name = "auction_id")
    var auctionId: UUID? = null

) : BaseEntity<UUID>() {

    fun addImage(image: ItemImage) {
        images.add(image)
        image.item = this

        if (image.category == ImageCategory.MAIN) {
            thumbnailUrl = image.url
        } else if (thumbnailUrl == null) {
            thumbnailUrl = image.url
        }
    }

    fun getImagesByCategory(category: ImageCategory): List<ItemImage> {
        return images.filter { it.category == category }.sortedBy { it.sortOrder }
    }

    fun getMainImage(): ItemImage? {
        return images.find { it.category == ImageCategory.MAIN }
    }
}

enum class ItemStatus {
    DRAFT,          // Being created by seller
    PENDING_AUCTION, // Added for approval auction
    LISTED_AUCTION, // Listed for auction but not active (future auction).
    ACTIVE_AUCTION, // Currently live in an auction
    SOLD,           // Payment pending/complete
    UNSOLD,         // Auction ended without reserve met
    ARCHIVED        // Soft deleted or very old
}

enum class ConditionGrade {
    EXCELLENT,
    VERY_GOOD,
    GOOD,
    FAIR,
    POOR,
    PARTS_ONLY
}