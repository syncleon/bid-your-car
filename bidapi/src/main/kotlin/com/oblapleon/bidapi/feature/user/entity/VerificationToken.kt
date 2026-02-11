package com.oblapleon.bidapi.feature.user.entity

import com.oblapleon.bidapi.common.entity.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "verification_tokens")
class VerificationToken(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    override var id: Long? = null,

    @Column(nullable = false, unique = true)
    var token: String = UUID.randomUUID().toString(),

    /**
     * FetchType.LAZY is crucial here.
     * You might want to validate a token without immediately loading the full User object
     * depending on the logic flow.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    var user: User,

    @Column(nullable = false)
    var expiryDate: Instant = Instant.now().plus(24, ChronoUnit.HOURS)

) : BaseEntity<Long>() {

    fun isExpired(): Boolean {
        return Instant.now().isAfter(expiryDate)
    }
}