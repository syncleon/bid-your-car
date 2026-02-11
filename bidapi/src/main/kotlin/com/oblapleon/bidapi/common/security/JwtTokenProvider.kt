package com.oblapleon.bidapi.common.security

import com.oblapleon.bidapi.feature.user.entity.User
import org.springframework.beans.factory.annotation.Value
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

    // 30 days is long for an access token. In strict prod, consider 15min + Refresh Token.
    // Keeping 30 days for simplicity as per your original code.
    private val tokenValidityInDays = 30L

    fun createToken(user: User): String {
        val now = Instant.now()
        val validity = now.plus(tokenValidityInDays, ChronoUnit.DAYS)

        // Convert roles to a space-delimited string (Standard "scope" format)
        // e.g. "ROLE_USER ROLE_ADMIN"
        val scope = user.roles.joinToString(" ") { "ROLE_${it.name}" }

        val claims = JwtClaimsSet.builder()
            .issuer("bid-api")
            .issuedAt(now)
            .expiresAt(validity)
            .subject(user.username) // Subject is usually the unique identifier (username/email)
            .claim("uid", user.id)  // Custom claim: User ID
            .claim("scp", scope)    // Standard claim: Scopes/Roles
            .build()

        val jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build()

        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).tokenValue
    }

    /**
     * Extracts authorities directly from the JWT "scp" claim.
     * No Database call required.
     */
    fun extractAuthorities(jwt: Jwt): List<GrantedAuthority> {
        val scope = jwt.claims["scp"] as? String ?: return emptyList()
        return scope.split(" ").map { SimpleGrantedAuthority(it) }
    }

    fun extractUserId(jwt: Jwt): Long? {
        return jwt.claims["uid"] as? Long
    }

    fun extractUsername(jwt: Jwt): String {
        return jwt.subject
    }
}