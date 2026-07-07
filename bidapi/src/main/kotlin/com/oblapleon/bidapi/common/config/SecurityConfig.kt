package com.oblapleon.bidapi.common.config

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.security.HttpCookieOAuth2AuthorizationRequestRepository
import com.oblapleon.bidapi.feature.user.security.OAuth2LoginSuccessHandler
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
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

class CookieBearerTokenResolver : BearerTokenResolver {
    private val defaultResolver = DefaultBearerTokenResolver()

    override fun resolve(request: HttpServletRequest): String? {
        val jwtCookie = request.cookies?.firstOrNull { it.name == "__session" }

        if (jwtCookie != null && jwtCookie.value.isNotBlank()) {
            return jwtCookie.value
        }

        return defaultResolver.resolve(request)
    }
}

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder,
    private val oAuth2LoginSuccessHandler: OAuth2LoginSuccessHandler,
    private val httpCookieOAuth2AuthorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository,
    @Value("\${cors.allowed-origins:http://localhost:5174}") private val allowedOrigins: List<String>
) {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(antMatcher("/actuator/health/**")).permitAll()
                    .requestMatchers(antMatcher("/actuator/prometheus")).permitAll()
                    .requestMatchers(antMatcher("/actuator/**")).hasAuthority("ADMIN")
                    .requestMatchers(antMatcher("/ws/**")).permitAll()
                    .requestMatchers(antMatcher("/api/v1/auth/**")).permitAll()
                    .requestMatchers(antMatcher("/login/oauth2/**")).permitAll()
                    .requestMatchers(antMatcher("/oauth2/**")).permitAll()
                    .requestMatchers(antMatcher("/v3/api-docs/**")).permitAll()
                    .requestMatchers(antMatcher("/swagger-ui/**")).permitAll()
                    .requestMatchers(antMatcher("/swagger-ui.html")).permitAll()
                    .requestMatchers(antMatcher("/error")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/auctions")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/auctions/**")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/bids/auction/**")).permitAll()
                    .requestMatchers(antMatcher("/favicon.ico")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/users/me")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/images/**")).permitAll()

                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2.authorizationEndpoint {
                    it.authorizationRequestRepository(httpCookieOAuth2AuthorizationRequestRepository)
                }
                oauth2.successHandler(oAuth2LoginSuccessHandler)
            }
            .oauth2ResourceServer { oauth2 ->
                oauth2.bearerTokenResolver(CookieBearerTokenResolver())
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

            JwtAuthenticationToken(jwt, authorities, username)
        }
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            val safeOrigins = this@SecurityConfig.allowedOrigins
                .map { it.trim() }
                .filter { it != "*" && it.isNotEmpty() }

            allowedOriginPatterns = safeOrigins
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