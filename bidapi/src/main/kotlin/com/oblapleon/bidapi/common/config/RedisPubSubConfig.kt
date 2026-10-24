package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.common.service.RedisWebSocketSubscriber
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.listener.ChannelTopic
import org.springframework.data.redis.listener.RedisMessageListenerContainer

@Configuration
class RedisPubSubConfig {

    private val logger = LoggerFactory.getLogger(RedisPubSubConfig::class.java)

    @Bean
    fun redisMessageListenerContainer(
        connectionFactory: RedisConnectionFactory,
        subscriber: RedisWebSocketSubscriber
    ): RedisMessageListenerContainer {
        val container = object : RedisMessageListenerContainer() {
            override fun start() {
                try {
                    super.start()
                } catch (e: Exception) {
                    logger.warn("RedisMessageListenerContainer could not connect on startup (Redis may be rate-limited or unavailable): " + e.message)
                }
            }
        }
        container.setConnectionFactory(connectionFactory)
        container.setErrorHandler { e ->
            logger.warn("Redis message listener error: " + e.message)
        }
        container.addMessageListener(subscriber, ChannelTopic("auction-bids-topic"))
        container.addMessageListener(subscriber, ChannelTopic("admin-bids-topic"))
        return container
    }
}
