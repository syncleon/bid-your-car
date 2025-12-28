package com.oblapleon.bidapi.config

import com.oblapleon.bidapi.security.JwtTokenProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder // Inject interface directly
) {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { authorize ->
                authorize
                    .requestMatchers(HttpMethod.POST, "/api/v1/login", "/api/v1/register").permitAll()
                    .requestMatchers(HttpMethod.GET, "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/api/v1/**").authenticated()
                    .anyRequest().permitAll() // Careful: usually you want .authenticated() here for safety
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

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf("http://localhost:5173", "http://localhost:8080")
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS") // Added OPTIONS
        configuration.allowedHeaders = listOf("*") // Simpler for dev, restrict in prod
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    /**
     * Converts a valid JWT into a UsernamePasswordAuthenticationToken containing the UserEntity.
     */
    class UserAuthenticationConverter(
        private val jwtTokenProvider: JwtTokenProvider
    ) : org.springframework.core.convert.converter.Converter<Jwt, AbstractAuthenticationToken> {

        override fun convert(jwt: Jwt): AbstractAuthenticationToken {
            // parsing logic moved here; parseToken now accepts the JWT object or claims
            val user = jwtTokenProvider.getUserFromClaims(jwt.claims)
                ?: throw org.springframework.security.oauth2.server.resource.InvalidBearerTokenException("User not found")

            return UsernamePasswordAuthenticationToken(user, jwt, listOf(SimpleGrantedAuthority("USER")))
        }
    }
}