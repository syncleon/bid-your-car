package com.oblapleon.bidapi.common.config

import com.nimbusds.jose.jwk.source.ImmutableSecret
import com.nimbusds.jose.proc.SecurityContext
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import javax.crypto.spec.SecretKeySpec

/**
 * Configuration class responsible for setting up JSON Web Token (JWT) infrastructure.
 * Configures the cryptographic beans required for encoding and decoding tokens
 * using a symmetric HMAC-SHA256 algorithm.
 */
@Configuration
class JwtEncodingConfig(
    @Value($$"${jwt.secret.key}")
    private val jwtKey: String,
) {
    private val secretKey = SecretKeySpec(jwtKey.toByteArray(), "HmacSHA256")

    /**
     * Configures a JwtDecoder bean using the symmetric secret key.
     * Enforces the HS256 algorithm for signature verification of incoming tokens.
     * * @return A configured [JwtDecoder] instance.
     */
    @Bean
    fun jwtDecoder(): JwtDecoder {
        return NimbusJwtDecoder.withSecretKey(secretKey)
            .macAlgorithm(MacAlgorithm.HS256)
            .build()
    }

    /**
     * Configures a JwtEncoder bean used to sign outgoing tokens.
     * Utilizes the [ImmutableSecret] provider to maintain the HMAC key context.
     * * @return A configured [JwtEncoder] instance.
     */
    @Bean
    fun jwtEncoder(): JwtEncoder {
        val secret = ImmutableSecret<SecurityContext>(secretKey)
        return NimbusJwtEncoder(secret)
    }
}