package com.oblapleon.bidapi.feature.user.repo

import com.oblapleon.bidapi.feature.user.entity.VerificationToken
import org.springframework.data.jpa.repository.JpaRepository

interface VerificationTokenRepo : JpaRepository<VerificationToken, Long> {
    fun findByToken(token: String): VerificationToken?
}