package com.oblapleon.bidapi.feature.user.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
class VerificationToken(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val token: String = UUID.randomUUID().toString(),

    @OneToOne(targetEntity = User::class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    val user: User,

    @Column(nullable = false)
    val expiryDate: LocalDateTime = LocalDateTime.now().plusHours(24)
)