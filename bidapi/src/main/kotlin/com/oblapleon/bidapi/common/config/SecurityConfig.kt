package com.oblapleon.bidapi.common.config

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher
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
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

// Реализация резолвера для извлечения JWT из HttpOnly куки
class CookieBearerTokenResolver : BearerTokenResolver {
    private val defaultResolver = DefaultBearerTokenResolver()

    override fun resolve(request: HttpServletRequest): String? {
        // 1. Сначала пытаемся найти токен в HttpOnly куке с именем "jwt"
        val jwtCookie = request.cookies?.firstOrNull { it.name == "jwt" }
        if (jwtCookie != null && jwtCookie.value.isNotBlank()) {
            return jwtCookie.value
        }

        // 2. Fallback: если куки нет, ищем в заголовке Authorization (для Swagger/Postman)
        return defaultResolver.resolve(request)
    }
}

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    private val jwtDecoder: JwtDecoder,
    @Value("\${cors.allowed-origins:http://localhost:5173}") private val allowedOrigins: String
) {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .cors(Customizer.withDefaults())
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    // 1. АКТУАТОР: Оставляем публичным только healthcheck (нужен для Docker/K8s/Балансировщиков)
                    .requestMatchers(antMatcher("/actuator/health/**")).permitAll()
                    .requestMatchers(antMatcher("/actuator/prometheus")).permitAll()

                    // Все остальные эндпоинты актуатора (вкл. prometheus) закрываем для обычных пользователей.
                    // Убедитесь, что название роли совпадает с тем, как оно хранится в базе/токене (например, "ROLE_ADMIN" или "ADMIN")
                    .requestMatchers(antMatcher("/actuator/**")).hasAuthority("ADMIN")

                    // 2. WEBSOCKET: Если авторизация STOMP происходит при отправке CONNECT-кадра
                    // (когда токен передается в заголовках STOMP), HTTP-хэндшейк должен оставаться permitAll().
                    // Убедитесь, что у вас есть ChannelInterceptor для проверки токенов внутри WebSocket!
                    .requestMatchers(antMatcher("/ws/**")).permitAll()

                    // Публичные эндпоинты
                    .requestMatchers(antMatcher("/api/v1/auth/**")).permitAll()
                    .requestMatchers(antMatcher("/v3/api-docs/**")).permitAll()
                    .requestMatchers(antMatcher("/swagger-ui/**")).permitAll()
                    .requestMatchers(antMatcher("/swagger-ui.html")).permitAll()
                    .requestMatchers(antMatcher("/error")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/auctions/**")).permitAll()
                    .requestMatchers(antMatcher(HttpMethod.GET, "/api/v1/bids/auction/**")).permitAll()
                    .requestMatchers(antMatcher("/favicon.ico")).permitAll()

                    .anyRequest().authenticated()
            }
            .oauth2ResourceServer { oauth2 ->
                // ВАЖНО: Подключаем наш кастомный резолвер куки!
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

            // Заменяем UsernamePasswordAuthenticationToken на JwtAuthenticationToken.
            // Он корректно сохранит объект Jwt внутри свойства "principal".
            JwtAuthenticationToken(jwt, authorities, username)
        }
    }
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            // 3. CORS: Исключаем символ "*" из списка доменов.
            // Сочетание allowCredentials = true и "*" разрешает куки/токены для ЛЮБОГО сайта, это опасно.
            val safeOrigins = this@SecurityConfig.allowedOrigins
                .split(",")
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