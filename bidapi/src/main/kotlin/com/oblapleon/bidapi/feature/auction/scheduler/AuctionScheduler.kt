package com.oblapleon.bidapi.feature.auction.scheduler

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class AuctionScheduler(
    private val auctionProcessorService: AuctionProcessorService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedRate = 1000)
    fun processAuctionLifecycle() {
        try {
            auctionProcessorService.processScheduledAuctions()
        } catch (e: Exception) {
            logger.error("Error while activating scheduled auctions: ${e.message}", e)
        }

        try {
            auctionProcessorService.processEndedAuctions()
        } catch (e: Exception) {
            logger.error("Error while closing expired auctions: ${e.message}", e)
        }
    }
}