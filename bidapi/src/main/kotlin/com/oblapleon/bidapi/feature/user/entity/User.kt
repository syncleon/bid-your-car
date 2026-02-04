package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.item.entity.Item
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
// Optional: Hibernate native soft delete annotations (if you want to automate filtering)
// @SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
// @Where(clause = "deleted_at IS NULL")
class User(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false, unique = true)
    var username: String,

    @Column(nullable = false)
    var password: String?,

    @Column(nullable = false, unique = true)
    var email: String,

    // Performance: Switch to LAZY. We will load this explicitly when needed.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf(),

    @OneToMany(mappedBy = "seller", fetch = FetchType.LAZY)
    var items: MutableSet<Item> = mutableSetOf(),

    @OneToMany(mappedBy = "winnerUser", fetch = FetchType.LAZY)
    var wonAuctions: MutableSet<Auction> = mutableSetOf(),

    @OneToMany(mappedBy = "bidder", fetch = FetchType.LAZY)
    var bids: MutableSet<Bid> = mutableSetOf(),

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null,

    @Column(nullable = false)
    var enabled: Boolean = false

) : BaseEntity() {

    // Essential for Entities used in Sets
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is User) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0
}