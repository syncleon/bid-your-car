package com.oblapleon.bidapi.feature.auction.scheduler

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.service.AuctionFinalizationService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import java.time.Instant
import org.springframework.core.task.TaskExecutor
import org.springframework.data.redis.core.StringRedisTemplate
import com.oblapleon.bidapi.feature.bid.service.BidQueueProducer

@Service
class AuctionProcessorService(
    private val auctionRepository: AuctionRepository,
    private val auctionFinalizationService: AuctionFinalizationService,
    private val redisTemplate: StringRedisTemplate,
    private val taskExecutor: TaskExecutor
) {
    private val logger = LoggerFactory.getLogger(AuctionProcessorService::class.java)

    /**
     * Scheduled task entrypoint: Finds all ACTIVE auctions that have passed their end time
     * and processes their finalization in parallel.
     */
    @SchedulerLock(name = "processEndedAuctions", lockAtLeastFor = "PT5S", lockAtMostFor = "PT5M")
    fun processEndedAuctions() {
        var page = 0
        while (true) {
            val now = Instant.now()
            val expiredAuctionIds = auctionRepository.findIdsByStatusAndEndTimeBefore(AuctionStatus.ACTIVE, now, PageRequest.of(page, 100))
            
            if (expiredAuctionIds.isEmpty()) break

            val processedCount = java.util.concurrent.atomic.AtomicInteger(0)
            val futures = expiredAuctionIds.map { auctionId ->
                java.util.concurrent.CompletableFuture.runAsync({
                    try {
                        val queueKey = BidQueueProducer.getQueueKey(auctionId)
                        val processingKey = BidQueueProducer.getProcessingQueueKey(auctionId)
                        val queueSize = redisTemplate.opsForList().size(queueKey) ?: 0L
                        val processingSize = redisTemplate.opsForList().size(processingKey) ?: 0L
                        
                        if (queueSize > 0 || processingSize > 0) {
                            logger.info("Skipping finalization for auction $auctionId because its bid queue is not empty (main: $queueSize, processing: $processingSize).")
                            return@runAsync
                        }
                        
                        auctionFinalizationService.finalizeAuction(auctionId)
                        processedCount.incrementAndGet()
                    } catch (e: Exception) {
                        logger.error("Failed to finalize auction ${auctionId}: ${e.message}", e)
                        try {
                            auctionFinalizationService.markAsFailed(auctionId)
                            processedCount.incrementAndGet()
                        } catch (ex: Exception) {
                            logger.error("Failed to mark auction $auctionId as FINALIZATION_FAILED", ex)
                        }
                    }
                }, taskExecutor)
            }

            java.util.concurrent.CompletableFuture.allOf(*futures.toTypedArray()).join()
            
            if (processedCount.get() == 0) {
                break
            }
        }
    }

    /**
     * Scheduled task entrypoint: Finds all SCHEDULED auctions that have reached their start time
     * and sets them to ACTIVE in parallel.
     */
    @SchedulerLock(name = "processScheduledAuctions", lockAtLeastFor = "PT5S", lockAtMostFor = "PT5M")
    fun processScheduledAuctions() {
        var page = 0
        while (true) {
            val now = Instant.now()
            val dueAuctionIds = auctionRepository.findIdsByStatusAndStartTimeBefore(AuctionStatus.SCHEDULED, now, PageRequest.of(page, 100))
            
            if (dueAuctionIds.isEmpty()) break

            val processedCount = java.util.concurrent.atomic.AtomicInteger(0)
            val futures = dueAuctionIds.map { auctionId ->
                java.util.concurrent.CompletableFuture.runAsync({
                    try {
                        auctionFinalizationService.activateScheduledAuction(auctionId)
                        processedCount.incrementAndGet()
                    } catch (e: Exception) {
                        logger.error("Failed to activate scheduled auction ${auctionId}: ${e.message}", e)
                        try {
                            auctionFinalizationService.markAsFailed(auctionId)
                            processedCount.incrementAndGet()
                        } catch (ex: Exception) {
                            logger.error("Failed to mark scheduled auction $auctionId as FINALIZATION_FAILED", ex)
                        }
                    }
                }, taskExecutor)
            }

            java.util.concurrent.CompletableFuture.allOf(*futures.toTypedArray()).join()
            
            if (processedCount.get() == 0) {
                break
            }
        }
    }
}
