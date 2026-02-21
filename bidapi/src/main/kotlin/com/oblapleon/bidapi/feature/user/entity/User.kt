package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.SQLDelete
import org.hibernate.annotations.SQLRestriction
import java.time.Instant

@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
class User(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    override var id: Long? = null,

    @Column(nullable = false, unique = true)
    var username: String,

    @Column(nullable = false)
    var password: String?,

    @Column(nullable = false, unique = true)
    var email: String,

    @Column(nullable = false)
    var enabled: Boolean = false,

    @Column(name = "deleted_at")
    var deletedAt: Instant? = null,

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf()

) : BaseEntity<Long>() {

    override fun toString(): String {
        return "User(id=$id, username='$username', email='$email', enabled=$enabled)"
    }

    fun addRole(role: Role) {
        roles.add(role)
    }
}

@Entity
@Table(name = "roles")
class Role(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    override var id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    var name: ERole

) : BaseEntity<Long>() {

    constructor() : this(null, ERole.USER)

    override fun toString(): String = "Role(name=$name)"
}

enum class ERole {
    USER,
    ADMIN
}