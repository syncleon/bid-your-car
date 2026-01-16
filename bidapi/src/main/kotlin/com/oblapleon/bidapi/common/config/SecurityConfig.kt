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

/**
 * Main configuration class for Spring Security.
 * Defines the security filter chain, password encoding, CORS settings,
 * and the mechanism for converting JWTs into authenticated user tokens.
 */
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder
)
{
    @Value("\${cors.allowed-origins:http://localhost:5173}")
    lateinit var allowedOrigins: List<String>

    /**
     * Configures the security filter chain.
     * Sets up public endpoints, OAuth2 resource server integration, session management,
     * and disables CSRF protection for stateless API operation.
     *
     * @param http The HttpSecurity object used to build the filter chain.
     * @return The configured SecurityFilterChain.
     */
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { authorize ->
                authorize
                    .requestMatchers(
                        HttpMethod.POST,
                        "/api/v1/login",
                        "/api/v1/register",
                        "/api/v1/restore"
                    ).permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/v1/verify"
                    ).permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/v1/items",
                        "/api/v1/items/{id}").permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/swagger-ui/**",
                        "/v3/api-docs/**"
                    ).permitAll()
                    .requestMatchers(
                        "/api/v1/**"
                    ).authenticated()
                    .anyRequest().permitAll()
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.decoder(jwtDecoder)
                    jwt.jwtAuthenticationConverter(UserAuthenticationConverter(jwtTokenProvider))
                }
            }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .headers { headers ->
                headers.frameOptions { it.disable() }
                headers.xssProtection { it.disable() }
            }

        return http.build()
    }

    /**
     * Provides the password encoder bean used for hashing and verifying passwords.
     * Uses the BCrypt hashing algorithm.
     *
     * @return A BCryptPasswordEncoder instance.
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    /**
     * Configures Cross-Origin Resource Sharing (CORS) settings.
     * Defines allowed origins, methods, and headers for incoming requests.
     *
     * @return The configured CorsConfigurationSource.
     */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()

        // Use the injected list instead of hardcoded strings
        configuration.allowedOrigins = allowedOrigins

        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true // Usually needed if frontend sends cookies/headers

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    /**
     * Custom converter that transforms a standard Spring Security JWT into an
     * application-specific AbstractAuthenticationToken.
     * It uses the JwtTokenProvider to extract the User entity from the JWT claims
     * and map authorities/roles.
     */
    class UserAuthenticationConverter(
        private val jwtTokenProvider: JwtTokenProvider
    ) : Converter<Jwt, AbstractAuthenticationToken> {

        /**
         * Converts the source JWT into a UsernamePasswordAuthenticationToken.
         *
         * @param jwt The source JWT to convert.
         * @return An authentication token containing the user principal and authorities.
         * @throws InvalidBearerTokenException if the user cannot be found from the token claims.
         */
        override fun convert(jwt: Jwt): AbstractAuthenticationToken {
            val user = jwtTokenProvider.getUserFromClaims(jwt.claims)
                ?: throw InvalidBearerTokenException("User not found")

            val authorities = user.roles.map { role ->
                SimpleGrantedAuthority("${role.name}")
            }

            return UsernamePasswordAuthenticationToken(user, jwt, authorities)
        }
    }
}