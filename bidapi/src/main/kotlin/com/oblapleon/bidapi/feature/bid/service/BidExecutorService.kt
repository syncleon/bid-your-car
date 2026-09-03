package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.util.*
import org.slf4j.LoggerFactory


/**
 * Internal service that executes a single bid attempt within its own transaction.
 * Must be a separate Spring bean so that [@Retryable] proxy works correctly
 * (self-invocation from [BiddingService] would bypass the retry proxy).
 */
@Service
class BidExecutorService(
    private val auctionRepository: AuctionRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val meterRegistry: MeterRegistry,
    private val cacheManager: org.springframework.cache.CacheManager,
    private val bidValidator: BidValidator
) {
    private val logger = LoggerFactory.getLogger(BidExecutorService::class.java)


    @Transactional
    fun executeBidsBatch(auctionId: UUID, reqs: List<com.oblapleon.bidapi.feature.bid.service.BidRequestMessage>) {
        if (reqs.isEmpty()) return
        
        val auction = auctionRepository.findByIdWithItemAndSellerPessimistic(auctionId).orElse(null) ?: return
        
        val uniqueBidderIds = reqs.map { it.bidderId }.toSet()
        val biddersMap = userRepository.findAllById(uniqueBidderIds).associateBy { it.id }

        val allGeneratedBids = mutableListOf<Bid>()
        var auctionUpdated = false

        for (req in reqs) {
            try {
                val bidder = biddersMap[req.bidderId] ?: continue
                val amountToBid = bidValidator.validateAndCalculateAmount(auction, req)

                val generatedBids = auction.processBidRequest(bidder, amountToBid, req.placedAt)
                if (generatedBids.isNotEmpty()) {
                    allGeneratedBids.addAll(generatedBids)
                    auctionUpdated = true
                }
            } catch (e: BadRequestException) {
                logger.warn("Bid rejected for auction $auctionId, bidder ${req.bidderId}: ${e.message}")
            } catch (e: Exception) {
                logger.error("Failed to process bid for auction $auctionId, bidder ${req.bidderId}", e)
            }
        }

        if (auctionUpdated && allGeneratedBids.isNotEmpty()) {
            val savedBids = bidRepository.saveAllAndFlush(allGeneratedBids).toList()
            auctionRepository.saveAndFlush(auction)
            cacheManager.getCache("auctions")?.put(auctionId, auction)

            savedBids.forEach { savedBid ->
                meterRegistry.counter("auction.bids.placed", "status", "success").increment()

                eventPublisher.publishEvent(
                    BidPlacedEvent(
                        auctionId = auction.id!!,
                        auctionCurrentPrice = auction.currentPrice,
                        auctionBidCount = auction.bidCount,
                        auctionEndTime = auction.endTime,
                        itemYear = auction.item.year,
                        itemMake = auction.item.make,
                        itemModel = auction.item.model,
                        bidId = savedBid.id!!,
                        bidAmount = savedBid.amount,
                        bidTime = savedBid.bidTime,
                        bidderUsername = savedBid.bidder.username,
                        bidderId = savedBid.bidder.id!!
                    )
                )
            }
        }
    }
}
