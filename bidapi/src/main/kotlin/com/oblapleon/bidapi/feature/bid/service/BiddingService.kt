package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.springframework.cache.CacheManager
import org.springframework.retry.annotation.Backoff
import org.springframework.retry.annotation.Retryable
import org.springframework.orm.ObjectOptimisticLockingFailureException
import java.util.*

@Service
class BiddingService(
    private val auctionRepository: AuctionRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val meterRegistry: MeterRegistry,
    private val cacheManager: CacheManager
) {

    /**
     * Places a bid on an active auction using the current authenticated user context.
     *
     * @param auctionId The UUID of the auction.
     * @param amount The maximum bid amount the user is willing to pay.
     * @param bidderId The ID of the user placing the bid.
     * @return The placed [Bid].
     */
    @Transactional
    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        return placeBidAsUser(auctionId, bidderId, amount)
    }

    /**
     * Internal method to process a bid, handling proxy bidding logic and time extensions.
     * Employs pessimistic locking to prevent race conditions on the auction.
     *
     * @param auctionId The UUID of the auction.
     * @param bidderId The ID of the user placing the bid.
     * @param maxAmount The user's maximum bid amount.
     * @return The recorded [Bid].
     * @throws BadRequestException for invalid bid states (inactive, low amount, etc.).
     */
    @Transactional
    @Retryable(
        retryFor = [ObjectOptimisticLockingFailureException::class],
        maxAttempts = 5,
        backoff = Backoff(delay = 100, multiplier = 2.0)
    )
    fun placeBidAsUser(auctionId: UUID, bidderId: Long, maxAmount: BigDecimal): Bid {
        val auction = auctionRepository.findById(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }

        val now = Instant.now()
        if (!auction.isLive) {
            throw BadRequestException("Auction is not active.")
        }
        if (auction.item.seller.id == bidderId) {
            throw ForbiddenException("You cannot bid on your own item.")
        }

        val bidder = userRepository.findById(bidderId).orElseThrow { NotFoundException("User not found") }

        val bidsToSave = auction.processBidRequest(bidder, maxAmount, now)

        val savedBids = bidRepository.saveAll(bidsToSave).toList()
        auctionRepository.save(auction) // Ensure version gets incremented

        savedBids.forEach { savedBid ->
            meterRegistry.counter("auction.bids.placed", "status", "success").increment()
            eventPublisher.publishEvent(BidPlacedEvent(auction, savedBid, savedBid.bidder.username))
        }

        return savedBids.first { it.bidder.id == bidderId }
    }

    /**
     * Automatically calculates and places the next minimum valid bid for the current user.
     *
     * @param auctionId The UUID of the auction.
     * @param bidderId The ID of the user placing the bid.
     * @return The placed [Bid].
     */
    @Transactional
    @Retryable(
        retryFor = [ObjectOptimisticLockingFailureException::class],
        maxAttempts = 5,
        backoff = Backoff(delay = 100, multiplier = 2.0)
    )
    fun placeNextMinimumBid(auctionId: UUID, bidderId: Long): Bid {
        val auction = auctionRepository.findById(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }

        if (auction.winningBid?.bidder?.id == bidderId) {
            throw BadRequestException("You already hold the highest bid.")
        }

        val exactAmountToBid = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(BidIncrementUtil.getDynamicBidIncrement(auction.currentPrice))
        }

        return placeBidAsUser(auctionId, bidderId, exactAmountToBid)
    }
}
