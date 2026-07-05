package com.oblapleon.bidapi.feature.user.security

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import org.springframework.stereotype.Component
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.util.Base64

@Component
class HttpCookieOAuth2AuthorizationRequestRepository : AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    companion object {
        const val OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "__session"
        const val COOKIE_EXPIRE_SECONDS = 180
    }

    override fun loadAuthorizationRequest(request: HttpServletRequest): OAuth2AuthorizationRequest? {
        val cookie = request.cookies?.firstOrNull { it.name == OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME } ?: return null
        return try {
            val bytes = Base64.getUrlDecoder().decode(cookie.value)
            ObjectInputStream(ByteArrayInputStream(bytes)).use { it.readObject() as OAuth2AuthorizationRequest }
        } catch (e: Exception) {
            null
        }
    }

    override fun saveAuthorizationRequest(
        authorizationRequest: OAuth2AuthorizationRequest?,
        request: HttpServletRequest,
        response: HttpServletResponse
    ) {
        if (authorizationRequest == null) {
            val cookie = Cookie(OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, "")
            cookie.path = "/"
            cookie.maxAge = 0
            response.addCookie(cookie)
            return
        }

        val baos = ByteArrayOutputStream()
        ObjectOutputStream(baos).use { it.writeObject(authorizationRequest) }
        val cookie = Cookie(OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, Base64.getUrlEncoder().encodeToString(baos.toByteArray()))
        cookie.path = "/"
        cookie.maxAge = COOKIE_EXPIRE_SECONDS
        cookie.secure = true
        cookie.isHttpOnly = true
        response.addCookie(cookie)
    }

    override fun removeAuthorizationRequest(
        request: HttpServletRequest,
        response: HttpServletResponse
    ): OAuth2AuthorizationRequest? {
        return loadAuthorizationRequest(request)
    }
}
