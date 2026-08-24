package com.oblapleon.bidapi.feature.auction.scheduler

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.service.AuctionFinalizationService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import java.time.Instant

@Service
class AuctionProcessorService(
    private val auctionRepository: AuctionRepository,
    private val auctionFinalizationService: AuctionFinalizationService
) {
    private val logger = LoggerFactory.getLogger(AuctionProcessorService::class.java)

    /**
     * Scheduled task entrypoint: Finds all ACTIVE auctions that have passed their end time
     * and processes their finalization.
     */
    @SchedulerLock(name = "processEndedAuctions", lockAtLeastFor = "PT5S", lockAtMostFor = "PT30S")
    fun processEndedAuctions() {
        val now = Instant.now()
        val expiredAuctionIds = auctionRepository.findIdsByStatusAndEndTimeBefore(AuctionStatus.ACTIVE, now, PageRequest.of(0, 100))

        expiredAuctionIds.forEach { auctionId ->
            try {
                auctionFinalizationService.finalizeAuction(auctionId)
            } catch (e: Exception) {
                logger.error("Failed to finalize auction ${auctionId}: ${e.message}", e)
            }
        }
    }

    /**
     * Scheduled task entrypoint: Finds all SCHEDULED auctions that have reached their start time
     * and sets them to ACTIVE.
     */
    @SchedulerLock(name = "processScheduledAuctions", lockAtLeastFor = "PT5S", lockAtMostFor = "PT30S")
    fun processScheduledAuctions() {
        val now = Instant.now()
        val dueAuctionIds = auctionRepository.findIdsByStatusAndStartTimeBefore(AuctionStatus.SCHEDULED, now, PageRequest.of(0, 100))

        dueAuctionIds.forEach { auctionId ->
            try {
                auctionFinalizationService.activateScheduledAuction(auctionId)
            } catch (e: Exception) {
                logger.error("Failed to activate scheduled auction ${auctionId}: ${e.message}", e)
            }
        }
    }
}
