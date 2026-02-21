package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(
    name = "item_images",
    indexes = [
        Index(name = "idx_item_image_item_category", columnList = "item_id, category")
    ]
)
class ItemImage(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    override var id: UUID? = null,

    @Column(nullable = false, length = 1024)
    var url: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var category: ImageCategory = ImageCategory.OTHER,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    var item: Item

) : BaseEntity<UUID>()

enum class ImageCategory {
    MAIN,
    EXTERIOR,
    INTERIOR,
    ENGINE,
    SERVICE,
    OTHER
}