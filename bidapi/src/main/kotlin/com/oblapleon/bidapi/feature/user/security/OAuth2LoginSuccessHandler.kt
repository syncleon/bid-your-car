package com.oblapleon.bidapi.feature.user.security

import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import java.util.UUID

@Component
class OAuth2LoginSuccessHandler(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${cors.allowed-origins:http://localhost:5174}") private val allowedOrigins: List<String>
) : SimpleUrlAuthenticationSuccessHandler() {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oauthUser = authentication.principal as OAuth2User
        val email = oauthUser.attributes["email"] as String
        val name = (oauthUser.attributes["name"] as String?)?.replace(" ", "") ?: email.substringBefore("@")

        var user = userRepository.findByEmail(email)

        if (user == null) {
            val userRole = roleRepository.findByName(ERole.USER)
                ?: throw IllegalStateException("Role USER not found")

            user = User(
                username = name + "_" + UUID.randomUUID().toString().substring(0, 5),
                email = email,
                password = passwordEncoder.encode(UUID.randomUUID().toString()),
                roles = mutableSetOf(userRole),
                enabled = true
            )
            user = userRepository.save(user)
        }
        val token = jwtTokenProvider.createToken(user)

        val isLocal = request.serverName == "localhost" || request.serverName == "127.0.0.1"

        val jwtCookie = ResponseCookie.from("__session", token)
            .httpOnly(true)
            .secure(!isLocal) // This forces HTTPS for the cookie in production
            .path("/")
            .maxAge((30 * 24 * 60 * 60).toLong())
            // Fix: Use 'None' for production (cross-site), and 'Lax' for local development (HTTP)
            .sameSite(if (isLocal) "Lax" else "None")
            .build()

        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString())

        val frontendUrl = if (isLocal) {
            "http://localhost:5173"
        } else {
            "https://bidyourcar.web.app"
        }

        redirectStrategy.sendRedirect(request, response, "$frontendUrl/")
    }
}