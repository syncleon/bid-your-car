package com.oblapleon.bidapi.common.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.data.redis.connection.Message
import org.springframework.data.redis.connection.MessageListener
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class RedisWebSocketSubscriber(
    private val messagingTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper
) : MessageListener {
    private val logger = LoggerFactory.getLogger(RedisWebSocketSubscriber::class.java)

    override fun onMessage(message: Message, pattern: ByteArray?) {
        try {
            val channel = String(message.channel)
            val body = String(message.body)

            if (channel == "auction-bids-topic") {
                val node = objectMapper.readTree(body)
                val auctionId = node.get("auctionId").asText()
                // Broadcast to local WebSocket subscribers
                val notificationDto = objectMapper.readValue(body, Any::class.java)
                messagingTemplate.convertAndSend("/topic/auctions/$auctionId", notificationDto)
            } else if (channel == "admin-bids-topic") {
                val feedItem = objectMapper.readValue(body, Any::class.java)
                messagingTemplate.convertAndSend("/topic/admin/bids/live", feedItem)
            }
        } catch (e: Exception) {
            logger.error("Failed to process Redis pub/sub message", e)
        }
    }
}
