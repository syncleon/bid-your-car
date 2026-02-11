package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.common.security.JwtTokenProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder,
    @Value("\${cors.allowed-origins:http://localhost:5173}") private val allowedOrigins: String
) {

    companion object {
        private val AUTH_WHITELIST = arrayOf(
            "/api/v1/auth/**"
        )
        private val SWAGGER_WHITELIST = arrayOf(
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        )
        private val PUBLIC_READ_WHITELIST = arrayOf(
            "/api/v1/items/**",
            "/api/v1/auctions/**",
            "/api/v1/bids/auction/**"
        )
    }


    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // ✅ NEW: Allow WebSocket Handshake
                    .requestMatchers("/ws/**").permitAll()

                    // Existing rules
                    .requestMatchers(*AUTH_WHITELIST).permitAll()
                    .requestMatchers(*SWAGGER_WHITELIST).permitAll()
                    .requestMatchers(HttpMethod.GET, *PUBLIC_READ_WHITELIST).permitAll()
                    .anyRequest().authenticated()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.decoder(jwtDecoder)
                    jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                }
            }
            .build()
    }

    private fun jwtAuthenticationConverter(): Converter<Jwt, AbstractAuthenticationToken> {
        return Converter { jwt ->
            val authorities = jwtTokenProvider.extractAuthorities(jwt)
            val username = jwtTokenProvider.extractUsername(jwt)
            UsernamePasswordAuthenticationToken(username, jwt, authorities)
        }
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            // ❌ DELETE OR COMMENT OUT THIS LINE:
            // allowedOrigins = this@SecurityConfig.allowedOrigins.split(",").map { it.trim() }

            // ✅ ADD THIS LINE INSTEAD:
            // "allowedOriginPatterns" supports wildcards (*) even with credentials enabled
            allowedOriginPatterns = this@SecurityConfig.allowedOrigins.split(",").map { it.trim() }

            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
            maxAge = 3600L
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}