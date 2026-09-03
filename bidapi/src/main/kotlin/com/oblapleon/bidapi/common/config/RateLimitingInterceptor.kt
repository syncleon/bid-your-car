package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.service.RateLimitingService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class RateLimitingInterceptor(
    private val rateLimitingService: RateLimitingService,
    private val authorizationHelper: AuthorizationHelper
) : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val bucket = try {
            val auth = org.springframework.security.core.context.SecurityContextHolder.getContext().authentication
            var userId: Long? = null
            
            if (auth != null && auth.isAuthenticated && auth !is org.springframework.security.authentication.AnonymousAuthenticationToken) {
                val principal = auth.principal
                if (principal is com.oblapleon.bidapi.feature.user.entity.User) {
                    userId = principal.id
                } else if (principal is org.springframework.security.oauth2.jwt.Jwt) {
                    userId = principal.claims["uid"]?.toString()?.toLongOrNull()
                } else if (principal is String) {
                    userId = principal.toLongOrNull()
                }
            }
            
            if (userId != null) {
                rateLimitingService.resolveBucket(userId)
            } else {
                getIpBucket(request)
            }
        } catch (e: Exception) {
            // If error during extraction, fallback to IP rate limiting
            getIpBucket(request)
        }

        val probe = bucket.tryConsumeAndReturnRemaining(1)

        if (!probe.isConsumed) {
            val waitForSeconds = probe.nanosToWaitForRefill / 1_000_000_000
            response.status = HttpStatus.TOO_MANY_REQUESTS.value()
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", waitForSeconds.toString())
            response.contentType = "application/json"
            response.writer.write("{\"error\": \"Too many requests! Please wait \$waitForSeconds seconds.\"}")
            return false
        }
        return true
    }

    private fun getIpBucket(request: HttpServletRequest): io.github.bucket4j.Bucket {
        val ip = request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim() 
            ?: request.remoteAddr 
            ?: "unknown"
        return rateLimitingService.resolveBucketByIp(ip)
    }
}
