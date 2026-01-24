package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.item.entity.Item
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf(),

    // Items this user is selling
    @OneToMany(mappedBy = "seller", fetch = FetchType.LAZY)
    var items: MutableList<Item> = mutableListOf(),

    // Added: Auctions won by this user
    @OneToMany(mappedBy = "winnerUser", fetch = FetchType.LAZY)
    var wonAuctions: MutableList<Auction> = mutableListOf(),

    // Added: Bids made by this user
    @OneToMany(mappedBy = "bidder", fetch = FetchType.LAZY)
    var bids: MutableList<Bid> = mutableListOf(),

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null,

    @Column(nullable = false)
    var enabled: Boolean = false

) : BaseEntity()