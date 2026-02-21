package com.oblapleon.bidapi.common.security

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.*
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.temporal.ChronoUnit

@Component
class JwtTokenProvider(
    private val jwtEncoder: JwtEncoder
) {
    private val tokenValidityInDays = 30L

    fun createToken(user: User): String {
        val now = Instant.now()
        val validity = now.plus(tokenValidityInDays, ChronoUnit.DAYS)
        val scope = user.roles.joinToString(" ") { "ROLE_${it.name}" }
        val claims = JwtClaimsSet.builder()
            .issuer("bid-api")
            .issuedAt(now)
            .expiresAt(validity)
            .subject(user.username)
            .claim("uid", user.id)
            .claim("scp", scope)
            .build()
        val jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build()
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).tokenValue
    }

    fun extractAuthorities(jwt: Jwt): List<GrantedAuthority> {
        val scope = jwt.claims["scp"] as? String ?: return emptyList()
        return scope.split(" ").map { SimpleGrantedAuthority(it) }
    }

    fun extractUsername(jwt: Jwt): String {
        return jwt.subject
    }
}