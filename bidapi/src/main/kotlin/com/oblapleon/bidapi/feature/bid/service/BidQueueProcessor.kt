package com.oblapleon.bidapi.feature.bid.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.DefaultRedisScript
import org.springframework.data.redis.core.script.RedisScript
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.util.UUID
import java.util.concurrent.Executors


@Service
class BidQueueProcessor(
    private val redisTemplate: StringRedisTemplate,
    private val objectMapper: ObjectMapper,
    private val bidExecutorService: BidExecutorService,
    private val taskExecutor: org.springframework.core.task.TaskExecutor
) {
    private val logger = LoggerFactory.getLogger(BidQueueProcessor::class.java)

    private val popBatchScript: RedisScript<List<*>> = DefaultRedisScript(
        """
        local source = KEYS[1]
        local dest = KEYS[2]
        local count = tonumber(ARGV[1])
        local items = redis.call('LRANGE', source, -count, -1)
        if #items > 0 then
            for i=1, #items do
                redis.call('LPUSH', dest, items[i])
            end
            redis.call('LTRIM', source, 0, -(#items + 1))
        end
        return items
        """.trimIndent(),
        List::class.java
    )

    @Scheduled(fixedDelay = 500)
    fun processBids() {
        val activeQueues = redisTemplate.opsForSet().members(BidQueueProducer.ACTIVE_QUEUES_KEY)
        
        if (activeQueues.isNullOrEmpty()) {
            return
        }

        for (auctionIdStr in activeQueues) {
            taskExecutor.execute {
                processAuctionQueue(auctionIdStr)
            }
        }
    }

    private fun processAuctionQueue(auctionIdStr: String) {
        val auctionId = UUID.fromString(auctionIdStr)
        val lockKey = "lock:processQueue:$auctionIdStr"
        
        val lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", java.time.Duration.ofSeconds(30)) == true
        
        if (!lockAcquired) {
            // Another node is processing this auction
            return
        }
        
        try {
            val queueKey = BidQueueProducer.getQueueKey(auctionId)
            val processingKey = BidQueueProducer.getProcessingQueueKey(auctionId)
            
            // 1. Process anything left in processing queue first (crash recovery)
            processQueue(auctionId, processingKey, true)
            
            // 2. Pop batches from main queue to processing queue until empty
            var hasMore = true
            var loopCount = 0
            while (hasMore && loopCount < 10) {
                loopCount++
                @Suppress("UNCHECKED_CAST")
                val rawBids = redisTemplate.execute(popBatchScript, listOf(queueKey, processingKey), "100") as? List<String>
                
                if (rawBids.isNullOrEmpty()) {
                    hasMore = false
                } else {
                    // 3. Process the new batch
                    processQueue(auctionId, processingKey, false)
                    
                    // Extend lock if we are still processing
                    redisTemplate.expire(lockKey, java.time.Duration.ofSeconds(30))
                }
            }
            
            // Check if queue is really empty before removing from active queues
            val finalQueueSize = redisTemplate.opsForList().size(queueKey) ?: 0L
            val finalProcessingSize = redisTemplate.opsForList().size(processingKey) ?: 0L
            if (finalQueueSize == 0L && finalProcessingSize == 0L) {
                redisTemplate.opsForSet().remove(BidQueueProducer.ACTIVE_QUEUES_KEY, auctionIdStr)
            }
        } finally {
            redisTemplate.delete(lockKey)
        }
    }

    private fun processQueue(auctionId: UUID, processingKey: String, isRecovery: Boolean) {
        val rawBids = redisTemplate.opsForList().range(processingKey, 0, -1)
        if (rawBids.isNullOrEmpty()) return

        if (isRecovery) {
            logger.info("Recovering ${rawBids.size} bids from processing queue for auction $auctionId")
        }

        val validRequests = mutableListOf<BidRequestMessage>()

        for (rawBid in rawBids) {
            try {
                val req = objectMapper.readValue(rawBid, BidRequestMessage::class.java)
                validRequests.add(req)
            } catch (e: Exception) {
                logger.error("Failed to parse bid request message", e)
            }
        }

        if (validRequests.isNotEmpty()) {
            try {
                bidExecutorService.executeBidsBatch(auctionId, validRequests)
                // Processing completed successfully, clear the processing queue
                redisTemplate.delete(processingKey)
            } catch (e: Exception) {
                logger.error("Error executing batch for auction $auctionId", e)
                try {
                    redisTemplate.opsForList().rightPushAll("auction:bids:dlq", rawBids)
                    // Successfully pushed to DLQ, clear the processing queue
                    redisTemplate.delete(processingKey)
                } catch (dlqEx: Exception) {
                    logger.error("Failed to push failed batch to DLQ! Data is kept in processing queue.", dlqEx)
                }
            }
        } else {
            // No valid requests, clear the processing queue
            redisTemplate.delete(processingKey)
        }
    }
}
