package com.oblapleon.bidapi.feature.auction.listener

import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.bid.dto.BidNotificationDto
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class AuctionNotificationListener(
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val logger = LoggerFactory.getLogger(AuctionNotificationListener::class.java)

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
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", notification)

            val globalFeedItem = mapOf(
                "auctionId" to auction.id.toString(),
                "carName" to "${auction.item.year} ${auction.item.make} ${auction.item.model}",
                "newPrice" to auction.currentPrice,
                "bidder" to bidderUsername,
                "timestamp" to savedBid.bidTime.toString()
            )
            messagingTemplate.convertAndSend("/topic/admin/bids/live", globalFeedItem)
        } catch (e: Exception) {
            logger.error("Failed to send WebSocket notification: ${e.message}", e)
        }
    }
}
