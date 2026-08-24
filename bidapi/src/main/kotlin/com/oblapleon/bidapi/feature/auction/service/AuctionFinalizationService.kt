package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.common.event.AuctionEndedEvent
import com.oblapleon.bidapi.common.event.AuctionStartedEvent
import org.springframework.context.ApplicationEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.transaction.annotation.Transactional
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID


@Service
class AuctionFinalizationService(
    private val auctionRepository: AuctionRepository,
    private val bidRepository: BidRepository,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(AuctionFinalizationService::class.java)

    /**
     * Finalizes an auction by determining if the reserve was met, updating status
     * to SOLD or UNSOLD, and sending out real-time websocket notifications.
     * Runs in its own transaction (REQUIRES_NEW) to prevent blocking batch jobs.
     *
     * @param auctionId The UUID of the auction to finalize.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun finalizeAuction(auctionId: UUID) {
        val auction = auctionRepository.findById(auctionId).orElse(null) ?: return

        if (auction.status != AuctionStatus.ACTIVE) return

        if (auction.bidCount > 0) {
            val highestBid = auction.winningBid ?: bidRepository.findTopByAuctionOrderByAmountDesc(auction)

            if (auction.isReserveMet) {
                auction.status = AuctionStatus.SOLD
                auction.winnerUser = highestBid?.bidder
                eventPublisher.publishEvent(AuctionEndedEvent(auction.id!!, auction.item.id!!, true, auction.winnerUser?.id))
            } else {
                auction.status = AuctionStatus.UNSOLD
                eventPublisher.publishEvent(AuctionEndedEvent(auction.id!!, auction.item.id!!, false, null))
            }
        } else {
            auction.status = AuctionStatus.UNSOLD
            eventPublisher.publishEvent(AuctionEndedEvent(auction.id!!, auction.item.id!!, false, null))
        }

        auctionRepository.save(auction)
    }

    /**
     * Activates a single SCHEDULED auction in its own transaction (REQUIRES_NEW),
     * matching the isolation pattern of finalizeAuction so one failure doesn't
     * roll back the entire scheduler batch.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun activateScheduledAuction(auctionId: UUID) {
        val auction = auctionRepository.findById(auctionId).orElse(null) ?: return

        if (auction.status != AuctionStatus.SCHEDULED) return

        val now = Instant.now()

        if (!auction.endTime.isAfter(now)) {
            val durationSeconds = ChronoUnit.SECONDS.between(auction.startTime, auction.endTime)
            if (durationSeconds > 0) {
                auction.startTime = now
                auction.endTime = now.plusSeconds(durationSeconds)
            }
        }

        auction.status = AuctionStatus.ACTIVE
        eventPublisher.publishEvent(AuctionStartedEvent(auction.id!!, auction.item.id!!))

        auctionRepository.save(auction)
        logger.info("Activated scheduled auction ${auction.id}")
    }
}