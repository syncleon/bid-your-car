package com.oblapleon.bidapi.feature.auction.scheduler

import com.oblapleon.bidapi.feature.auction.service.AuctionService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class AuctionScheduler(
    private val auctionService: AuctionService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedRate = 15000)
    fun processAuctionLifecycle() {
        try {
            auctionService.processScheduledAuctions()
        } catch (e: Exception) {
            logger.error("Error while activating scheduled auctions: ${e.message}", e)
        }

        try {
            auctionService.processEndedAuctions()
        } catch (e: Exception) {
            logger.error("Error while closing expired auctions: ${e.message}", e)
        }
    }
}