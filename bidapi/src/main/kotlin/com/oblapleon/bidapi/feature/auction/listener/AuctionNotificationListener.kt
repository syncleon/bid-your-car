package com.oblapleon.bidapi.feature.auction.listener

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.bid.dto.BidNotificationDto
import com.oblapleon.bidapi.common.event.AuctionEndedEvent
import com.oblapleon.bidapi.common.event.AuctionStartedEvent
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class AuctionNotificationListener(
    private val redisTemplate: StringRedisTemplate,
    private val objectMapper: ObjectMapper,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = LoggerFactory.getLogger(AuctionNotificationListener::class.java)

    /**
     * Publishes a bid notification to Redis Pub/Sub after the transaction commits.
     *
     * Uses the scalar snapshot in [BidPlacedEvent] — no JPA entity access here,
     * so no [org.hibernate.LazyInitializationException] risk.
     *
     * Cache invalidation is intentionally removed: the [BidPlacedEvent] no longer carries
     * a live JPA entity, so we cannot put a stale entity into the Redis cache.
     * The cache entry for this auction will expire naturally (TTL = 5 min) or be evicted
     * on status changes (approve/cancel) via [@CacheEvict] in [AuctionService].
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleBidPlacedEvent(event: BidPlacedEvent) {
        try {
            val notification = BidNotificationDto(
                auctionId = event.auctionId,
                newPrice = event.auctionCurrentPrice,
                bidCount = event.auctionBidCount,
                bidderUsername = event.bidderUsername,
                bidTime = event.bidTime,
                newEndTime = event.auctionEndTime
            )

            val notificationJson = objectMapper.writeValueAsString(notification)
            redisTemplate.convertAndSend("auction-bids-topic", notificationJson)

            val globalFeedItem = mapOf(
                "auctionId" to event.auctionId.toString(),
                "carName" to "${event.itemYear} ${event.itemMake} ${event.itemModel}",
                "newPrice" to event.auctionCurrentPrice,
                "bidder" to event.bidderUsername,
                "timestamp" to event.bidTime.toString()
            )
            val globalFeedJson = objectMapper.writeValueAsString(globalFeedItem)
            redisTemplate.convertAndSend("admin-bids-topic", globalFeedJson)

        } catch (e: Exception) {
            logger.error("Failed to send Redis bid notification for auction ${event.auctionId}: ${e.message}", e)
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleAuctionEndedEvent(event: AuctionEndedEvent) {
        try {
            val status = if (event.isSold) "SOLD" else "UNSOLD"
            val finalNotification = mapOf(
                "auctionId" to event.auctionId.toString(),
                "status" to status,
                "winner" to (event.winnerId?.toString() ?: "No Winner")
            )
            messagingTemplate.convertAndSend("/topic/auctions/${event.auctionId}", finalNotification)
        } catch (e: Exception) {
            logger.error("Failed to send auction closed notification for auction ${event.auctionId}: ${e.message}", e)
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleAuctionStartedEvent(event: AuctionStartedEvent) {
        try {
            val notification = mapOf(
                "auctionId" to event.auctionId.toString(),
                "status" to "ACTIVE"
            )
            messagingTemplate.convertAndSend("/topic/auctions/${event.auctionId}", notification)
        } catch (e: Exception) {
            logger.error("Failed to send auction started notification for auction ${event.auctionId}: ${e.message}", e)
        }
    }
}
