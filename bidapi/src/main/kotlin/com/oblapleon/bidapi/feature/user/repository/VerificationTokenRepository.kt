package com.oblapleon.bidapi.feature.user.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.entity.VerificationToken
import org.springframework.data.jpa.repository.Modifying
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface VerificationTokenRepository : BaseRepository<VerificationToken, Long> {

    fun findByToken(token: String): VerificationToken?
    fun findByUser(user: User): VerificationToken?

    @Modifying
    fun deleteAllByExpiryDateBefore(now: Instant)
}