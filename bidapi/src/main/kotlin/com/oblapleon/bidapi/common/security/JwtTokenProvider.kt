package com.oblapleon.bidapi.common.security

import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.service.UserService
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.*
import org.springframework.stereotype.Component
import org.springframework.context.annotation.Lazy
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Service component responsible for the lifecycle management of JSON Web Tokens.
 * Handles the generation of signed tokens and the extraction of domain entities
 * from validated JWT claims.
 */
@Component
class JwtTokenProvider(
    private val jwtEncoder: JwtEncoder,
    @Lazy private val userService: UserService
) {

    /**
     * Generates a signed HS256 JWT for a specific user.
     * Includes standard claims such as issue date and expiration (30 days),
     * alongside custom claims like the internal user ID.
     *
     * @param user The authenticated user entity for whom the token is generated.
     * @return A serialized JWT string.
     */
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

    /**
     * Retrieves a domain [User] entity based on the claims extracted from a valid JWT.
     *
     * @param claims A map of claims decoded from a validated token.
     * @return The [User] entity if found, or null if the ID is missing or the user does not exist.
     */
    fun getUserFromClaims(claims: Map<String, Any>): User? {
        return try {
            val userId = claims["userId"] as? Long ?: return null
            userService.findById(userId)
        } catch (e: Exception) {
            null
        }
    }
}