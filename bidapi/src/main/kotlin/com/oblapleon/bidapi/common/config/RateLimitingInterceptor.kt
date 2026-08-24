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
        try {
            val user = authorizationHelper.getCurrentUser()
            val userId = user.id ?: return true

            val bucket = rateLimitingService.resolveBucket(userId)
            val probe = bucket.tryConsumeAndReturnRemaining(1)

            if (!probe.isConsumed) {
                val waitForSeconds = probe.nanosToWaitForRefill / 1_000_000_000
                response.status = HttpStatus.TOO_MANY_REQUESTS.value()
                response.addHeader("X-Rate-Limit-Retry-After-Seconds", waitForSeconds.toString())
                response.contentType = "application/json"
                response.writer.write("{\"error\": \"You are bidding too fast! Please wait \$waitForSeconds seconds.\"}")
                return false
            }
        } catch (e: Exception) {
            // If user is not authenticated or other error, let it pass (security config handles auth)
        }
        return true
    }
}
