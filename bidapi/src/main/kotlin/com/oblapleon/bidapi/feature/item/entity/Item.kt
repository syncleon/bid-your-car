package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
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
        // Composite index for common filtering (e.g. "Find all Ford Mustangs")
        Index(name = "idx_item_make_model", columnList = "make, model"),
        // Index for filtering by status (e.g. "Show me active items")
        Index(name = "idx_item_status", columnList = "status"),
        Index(name = "idx_item_seller_id", columnList = "seller_id")
    ]
)
class Item(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    override var id: UUID? = null,

    @Version
    var version: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ItemStatus = ItemStatus.DRAFT,

    @Column(name = "production_year", nullable = false)
    var year: Int,

    @Column(nullable = false, length = 50)
    var make: String,

    @Column(nullable = false, length = 50)
    var model: String,

    // Removed 'unique = true'. If a car doesn't sell and is relisted
    // next month, it will be a new Item record with the same VIN.
    @Column(nullable = false, length = 17)
    var vin: String,

    @Column(nullable = false)
    var location: String,

    @Column(nullable = false)
    var mileage: Int,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    // Denormalized field: Allows showing a picture in search results
    // without joining the Images table.
    @Column(name = "thumbnail_url")
    var thumbnailUrl: String? = null,

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    var seller: User,

    @OneToMany(mappedBy = "item", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC") // Ensure images load in correct order
    @BatchSize(size = 20)
    var images: MutableSet<ItemImage> = mutableSetOf(),

    // Removed CascadeType.ALL. Auctions are complex financial entities.
    // Deleting an item should strictly NOT delete historical auction data
    // unless explicitly intended.
    @OneToMany(mappedBy = "item", fetch = FetchType.LAZY)
    var auctions: MutableSet<Auction> = mutableSetOf()

) : BaseEntity<UUID>() {

    // Helper to manage images and auto-set the thumbnail
    fun addImage(image: ItemImage) {
        images.add(image)
        image.item = this
        if (thumbnailUrl == null) {
            thumbnailUrl = image.url
        }
    }
}

enum class ItemStatus {
    DRAFT,          // Being created by seller
    PENDING_REVIEW, // Waiting for admin approval
    AVAILABLE,      // Approved, ready for auction
    ACTIVE_AUCTION, // Currently live in an auction
    SOLD,           // Payment pending/complete
    UNSOLD,         // Auction ended without reserve met
    ARCHIVED        // Soft deleted or very old
}