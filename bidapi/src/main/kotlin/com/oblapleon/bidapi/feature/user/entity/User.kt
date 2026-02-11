package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.SQLDelete
import org.hibernate.annotations.SQLRestriction
import java.time.Instant

@Entity
@Table(name = "users")
// Soft delete strategy: Updates the column instead of deleting the row
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
// Automatically filters out soft-deleted users in all Repository queries
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

    /**
     * Unidirectional Many-to-Many is preferred for simple role association.
     * Using Set to prevent duplicates.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf()

    // PERFORMANCE NOTE:
    // Removed @OneToMany for `items`, `wonAuctions`, and `bids`.
    // fetching a User should not risk loading thousands of history records.
    // Query these via their respective Repositories.

) : BaseEntity<Long>() {

    // Explicit toString prevents circular recursion and leaks of sensitive data (password)
    override fun toString(): String {
        return "User(id=$id, username='$username', email='$email', enabled=$enabled)"
    }

    // Helper method to add roles cleanly
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

    // No-arg constructor for JPA (if not using kotlin-jpa plugin, explicit is safer)
    constructor() : this(null, ERole.USER)

    override fun toString(): String = "Role(name=$name)"
}

enum class ERole {
    USER,
    ADMIN
}