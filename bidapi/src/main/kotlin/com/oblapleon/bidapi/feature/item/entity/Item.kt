package com.oblapleon.bidapi.feature.item.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.user.entity.User
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import java.math.BigDecimal
import java.sql.Types
import java.util.UUID

@Entity
@Table(
    name = "items",
    indexes = [
        Index(name = "idx_item_make_model", columnList = "make, model"),
        Index(name = "idx_item_seller_id", columnList = "seller_id")
    ]
)
class Item(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(updatable = false, nullable = false)
    var id: UUID? = null,

    @Column(nullable = false, length = 50)
    var make: String,

    @Column(nullable = false, length = 50)
    var model: String,

    @Column(nullable = false, unique = true, length = 17)
    var vin: String,

    @Column(nullable = false)
    var location: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false) // This will be a BIGINT in DB to match User.id
    var seller: User,

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

    @Column(name = "buy_now_price", precision = 19, scale = 2)
    var buyNowPrice: BigDecimal? = null,

    @OneToMany(mappedBy = "item", cascade = [CascadeType.ALL], orphanRemoval = true)
    var images: MutableList<ItemImage> = mutableListOf()

) : BaseEntity()