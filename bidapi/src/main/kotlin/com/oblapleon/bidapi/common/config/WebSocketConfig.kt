package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

import org.springframework.beans.factory.annotation.Value

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val jwtDecoder: JwtDecoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val userRepository: UserRepository,
    @Value("\${cors.allowed-origins:http://localhost:5174}") private val allowedOrigins: List<String>
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        val safeOrigins = allowedOrigins.map { it.trim() }.filter { it != "*" && it.isNotEmpty() }.toTypedArray()
        
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(*safeOrigins)
            .withSockJS()
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(object : ChannelInterceptor {
            override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
                val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)
                if (accessor != null && StompCommand.CONNECT == accessor.command) {
                    
                    var token: String? = null

                    // 1. Try to get token from native headers (used by clients)
                    val authHeaders = accessor.getNativeHeader("Authorization")
                    if (!authHeaders.isNullOrEmpty()) {
                        val bearer = authHeaders[0]
                        if (bearer.startsWith("Bearer ")) {
                            token = bearer.substring(7)
                        }
                    }

                    if (token != null) {
                        try {
                            val jwt = jwtDecoder.decode(token)
                            val username = jwtTokenProvider.extractUsername(jwt)
                            
                            val authorities = jwtTokenProvider.extractAuthorities(jwt)
                            accessor.user = JwtAuthenticationToken(jwt, authorities, username)
                        } catch (e: Exception) {
                            throw AccessDeniedException("Invalid WebSocket authentication token")
                        }
                    } else {
                        throw AccessDeniedException("Missing WebSocket authentication token")
                    }
                } else if (accessor != null && StompCommand.SUBSCRIBE == accessor.command) {
                    val destination = accessor.destination
                    if (destination != null && destination.startsWith("/topic/admin")) {
                        val user = accessor.user as? JwtAuthenticationToken
                            ?: throw AccessDeniedException("Not authenticated")
                            
                        val isAdmin = user.authorities.any { it.authority == "ROLE_ADMIN" }
                        if (!isAdmin) {
                            throw AccessDeniedException("Access denied to admin topic")
                        }
                    }
                }
                return message
            }
        })
    }
}