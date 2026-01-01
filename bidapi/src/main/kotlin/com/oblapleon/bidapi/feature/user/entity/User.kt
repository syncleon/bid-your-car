package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
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

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null,

    @Column(nullable = false)
    var enabled: Boolean = false



) : BaseEntity()