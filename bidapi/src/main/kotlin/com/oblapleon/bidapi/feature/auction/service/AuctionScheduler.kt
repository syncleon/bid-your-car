package com.oblapleon.bidapi.feature.auction.service

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class AuctionScheduler(
    private val auctionService: AuctionService
) {

    /**
     * Runs every minute to check for expired auctions.
     * fixedRate: Time between the start of the last invocation and the next.
     */
    @Scheduled(fixedRate = 60000)
    fun finalizeExpiredAuctions() {
            auctionService.processAllExpiredAuctions()
    }
}