package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(name = "item_images")
class ItemImage(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    override var id: UUID? = null,

    @Column(nullable = false, length = 1024)
    var url: String,

    // Production necessity: Order matters (e.g., Front, Side, Interior)
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    var item: Item

) : BaseEntity<UUID>()