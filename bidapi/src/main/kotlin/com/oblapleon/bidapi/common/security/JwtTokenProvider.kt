package com.oblapleon.bidapi.common.security

import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.service.UserService
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.*
import org.springframework.stereotype.Component
import org.springframework.context.annotation.Lazy
import java.time.Instant
import java.time.temporal.ChronoUnit

@Component
class JwtTokenProvider(
    private val jwtEncoder: JwtEncoder,
    @Lazy private val userService: UserService
) {
    fun createToken(user: User): String {
        val now = Instant.now()
        val validity = now.plus(30L, ChronoUnit.DAYS)

        val jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build()

        val claims = JwtClaimsSet.builder()
            .issuedAt(now)
            .expiresAt(validity)
            .subject(user.username)
            .claim("userId", user.id)
            .build()

        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).tokenValue
    }

    fun getUserFromClaims(claims: Map<String, Any>): User? {
        return try {
            val userId = claims["userId"] as? Long ?: return null
            userService.findById(userId)
        } catch (e: Exception) {
            null
        }
    }
}