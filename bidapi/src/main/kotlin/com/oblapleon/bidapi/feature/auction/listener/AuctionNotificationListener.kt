package com.oblapleon.bidapi.feature.auction.listener

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.bid.dto.BidNotificationDto
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import org.springframework.scheduling.annotation.Async
import org.springframework.messaging.simp.SimpMessagingTemplate
import com.oblapleon.bidapi.common.event.AuctionEndedEvent
import com.oblapleon.bidapi.common.event.AuctionStartedEvent

import org.springframework.cache.CacheManager

@Component
class AuctionNotificationListener(
    private val redisTemplate: StringRedisTemplate,
    private val objectMapper: ObjectMapper,
    private val messagingTemplate: SimpMessagingTemplate,
    private val cacheManager: CacheManager
) {
    private val logger = LoggerFactory.getLogger(AuctionNotificationListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun updateAuctionCache(event: BidPlacedEvent) {
        cacheManager.getCache("auctions")?.put(event.auction.id!!, event.auction)
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleBidPlacedEvent(event: BidPlacedEvent) {
        try {
            val auction = event.auction
            val savedBid = event.savedBid
            val bidderUsername = event.bidderUsername

            val notification = BidNotificationDto(
                auctionId = auction.id!!,
                newPrice = auction.currentPrice,
                bidCount = auction.bidCount,
                bidderUsername = bidderUsername,
                bidTime = savedBid.bidTime,
                newEndTime = auction.endTime
            )
            
            val notificationJson = objectMapper.writeValueAsString(notification)
            redisTemplate.convertAndSend("auction-bids-topic", notificationJson)

            val globalFeedItem = mapOf(
                "auctionId" to auction.id.toString(),
                "carName" to "${auction.item.year} ${auction.item.make} ${auction.item.model}",
                "newPrice" to auction.currentPrice,
                "bidder" to bidderUsername,
                "timestamp" to savedBid.bidTime.toString()
            )
            val globalFeedJson = objectMapper.writeValueAsString(globalFeedItem)
            redisTemplate.convertAndSend("admin-bids-topic", globalFeedJson)
        } catch (e: Exception) {
            logger.error("Failed to send Redis notification: ${e.message}", e)
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
