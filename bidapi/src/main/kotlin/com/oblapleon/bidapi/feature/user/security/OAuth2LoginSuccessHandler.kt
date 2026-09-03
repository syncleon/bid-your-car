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
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Component
@Transactional
class OAuth2LoginSuccessHandler(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${app.frontend-url:http://localhost:5173}") private val frontendUrl: String,
    @Value("\${app.cookie.secure:true}") private val cookieSecure: Boolean,
    @Value("\${app.cookie.same-site:Lax}") private val cookieSameSite: String,
    @Value("\${app.cookie.max-age-seconds:2592000}") private val cookieMaxAge: Long
) : SimpleUrlAuthenticationSuccessHandler() {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oauthUser = authentication.principal as OAuth2User
        val email = oauthUser.attributes["email"] as String
        val name = (oauthUser.attributes["name"] as String?)?.replace(" ", "") ?: email.substringBefore("@")

        userRepository.restoreUserByEmail(email)
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

        // Set the JWT in an httpOnly, Secure cookie — matching the login() endpoint behaviour.
        // This prevents the token from being exposed in:
        //   - browser history
        //   - server-side access logs
        //   - Referer headers sent to third-party resources
        val cookie = ResponseCookie.from("__session", token)
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/")
            .maxAge(cookieMaxAge)
            .sameSite(cookieSameSite)
            .build()

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())

        // Redirect to the frontend OAuth2 callback page WITHOUT the token in the URL.
        redirectStrategy.sendRedirect(request, response, "$frontendUrl/oauth2/redirect")
    }
}