package com.oblapleon.bidapi.feature.bid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class BidRequestMessage(
    val auctionId: UUID,
    val bidderId: Long,
    val maxAmount: BigDecimal?,
    val isQuickBid: Boolean = false,
    val placedAt: Instant = Instant.now()
)

@Service
class BidQueueProducer(
    private val redisTemplate: StringRedisTemplate,
    private val objectMapper: ObjectMapper
) {
    companion object {
        const val ACTIVE_QUEUES_KEY = "auction:active_queues"
        const val PROCESSING_QUEUE_SUFFIX = ":processing"
        fun getQueueKey(auctionId: UUID) = "auction:bids:queue:$auctionId"
        fun getProcessingQueueKey(auctionId: UUID) = getQueueKey(auctionId) + PROCESSING_QUEUE_SUFFIX
    }

    fun enqueueBid(auctionId: UUID, bidderId: Long, maxAmount: BigDecimal) {
        val message = BidRequestMessage(auctionId, bidderId, maxAmount, false)
        pushToQueue(auctionId, message)
    }

    fun enqueueQuickBid(auctionId: UUID, bidderId: Long) {
        val message = BidRequestMessage(auctionId, bidderId, null, true)
        pushToQueue(auctionId, message)
    }

    private fun pushToQueue(auctionId: UUID, message: BidRequestMessage) {
        val json = objectMapper.writeValueAsString(message)
        val queueKey = getQueueKey(auctionId)
        
        redisTemplate.execute { connection ->
            val keyBytes = redisTemplate.stringSerializer.serialize(queueKey)
            val valBytes = redisTemplate.stringSerializer.serialize(json)
            val activeQueuesKeyBytes = redisTemplate.stringSerializer.serialize(ACTIVE_QUEUES_KEY)
            val auctionIdBytes = redisTemplate.stringSerializer.serialize(auctionId.toString())
            
            if (keyBytes != null && valBytes != null && activeQueuesKeyBytes != null && auctionIdBytes != null) {
                connection.listCommands().lPush(keyBytes, valBytes)
                connection.setCommands().sAdd(activeQueuesKeyBytes, auctionIdBytes)
            } else {
                throw com.oblapleon.bidapi.common.exception.InternalServerException("Failed to serialize bid request for Redis queue")
            }
            null
        }
    }
}
