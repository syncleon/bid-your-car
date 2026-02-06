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
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder
) {

    @Value("\${cors.allowed-origins:http://localhost:5173}")
    lateinit var allowedOrigins: String

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // --- Public Endpoints ---
                    // Auth
                    .requestMatchers(HttpMethod.POST, "/api/v1/login", "/api/v1/register", "/api/v1/restore").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/verify").permitAll()

                    // Read-only Item data
                    .requestMatchers(HttpMethod.GET, "/api/v1/items", "/api/v1/items/{id}").permitAll()

                    // Read-only Auction data
                    .requestMatchers(HttpMethod.GET,
                        "/api/v1/auctions",
                        "/api/v1/auctions/{id}",
                        "/api/v1/auctions/ending-soon",
                        "/api/v1/bids/auction/{auctionId}"
                    ).permitAll()

                    // Swagger / OpenAPI
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                    // --- Secured Endpoints ---
                    // Any other API call requires a valid token
                    .requestMatchers("/api/v1/**").authenticated()

                    // Allow error handling or other non-api paths
                    .anyRequest().permitAll()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.decoder(jwtDecoder)
                    jwt.jwtAuthenticationConverter(UserAuthenticationConverter(jwtTokenProvider))
                }
            }
            .headers { headers ->
                headers.frameOptions { it.disable() }
                headers.xssProtection { it.disable() }
            }

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = allowedOrigins.split(",").map { it.trim() }
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    /**
     * Converts JWT to Authentication Token.
     * Relies on the fixed UserRepo to load roles eagerly via @EntityGraph.
     */
    class UserAuthenticationConverter(
        private val jwtTokenProvider: JwtTokenProvider
    ) : Converter<Jwt, AbstractAuthenticationToken> {

        override fun convert(jwt: Jwt): AbstractAuthenticationToken {
            val user = jwtTokenProvider.getUserFromClaims(jwt.claims)
                ?: throw InvalidBearerTokenException("User not found in token claims")
            val authorities = user.roles.map { role ->
                SimpleGrantedAuthority("${role.name}")
            }

            return UsernamePasswordAuthenticationToken(user, jwt, authorities)
        }
    }
}