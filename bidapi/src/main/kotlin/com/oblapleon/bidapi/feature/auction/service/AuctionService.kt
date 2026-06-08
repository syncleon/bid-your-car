package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exception.*
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import io.micrometer.core.instrument.MeterRegistry
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

@Service
class AuctionService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val meterRegistry: MeterRegistry,
    private val authorizationHelper: AuthorizationHelper,
    private val auctionFinalizationService: AuctionFinalizationService
) {

    private val logger = LoggerFactory.getLogger(AuctionService::class.java)

    fun findById(id: UUID): Auction {
        return auctionRepository.findById(id)
            .orElseThrow { NotFoundException("Auction not found.") }
    }

    fun findAuctionsByCriteria(
        status: AuctionStatus?,
        filterType: String?,
        pageable: Pageable
    ): Page<Auction> {
        val now = Instant.now()
        val targetStatus = status ?: AuctionStatus.ACTIVE

        if (targetStatus != AuctionStatus.ACTIVE) {
            return auctionRepository.findByStatusOrderByEndTimeDesc(targetStatus, pageable)
        }

        return when (filterType?.lowercase()) {
            "ending_soon" -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(targetStatus, now, pageable)
            "just_listed" -> auctionRepository.findByStatusAndStartTimeBeforeOrderByStartTimeDesc(targetStatus, now, pageable)
            else -> auctionRepository.findByStatusOrderByEndTimeDesc(targetStatus, pageable)
        }
    }

    fun findSoldAuctionsRecentlyAdded(pageable: Pageable): Page<Auction> {
        return auctionRepository.findByStatusOrderByEndTimeDesc(AuctionStatus.SOLD, pageable)
    }

    fun findBySeller(sellerId: Long, pageable: Pageable): Page<Auction> {
        authorizationHelper.checkOwnerOrAdmin(sellerId) // <-- Enforce ownership/admin access
        return auctionRepository.findAllBySellerId(sellerId, pageable)
    }

    fun findWonByUser(userId: Long, pageable: Pageable): Page<Auction> {
        authorizationHelper.checkOwnerOrAdmin(userId) // <-- Enforce ownership/admin access
        return auctionRepository.findAllWonByUserId(userId, pageable)
    }

    @Transactional
    fun createAuction(request: CreateAuctionDto): Auction {
        val item = itemRepository.findById(request.itemId)
            .orElseThrow { NotFoundException("Item not found") }

        authorizationHelper.checkOwnerOrAdmin(item.seller.id!!)

        if (item.status != ItemStatus.DRAFT && item.status != ItemStatus.UNSOLD) {
            throw ConflictException("Item is not available for a new auction.")
        }

        val activeStatuses = listOf(AuctionStatus.ACTIVE, AuctionStatus.PENDING_APPROVAL, AuctionStatus.SCHEDULED)
        if (auctionRepository.existsByItemIdAndStatusIn(item.id!!, activeStatuses)) {
            throw ConflictException("Item is already linked to an active or pending auction.")
        }

        if (request.endTime.isBefore(request.startTime)) {
            throw BadRequestException("End time must be after start time.")
        }

        val auction = Auction(
            item = item,
            startPrice = request.startPrice,
            currentPrice = request.startPrice,
            reservePrice = item.reservePrice,
            isNoReserve = item.isNoReserve,
            minBidIncrement = request.minBidIncrement,
            startTime = request.startTime,
            endTime = request.endTime,
            status = AuctionStatus.PENDING_APPROVAL
        )

        val savedAuction = auctionRepository.save(auction)
        item.status = ItemStatus.PENDING_AUCTION
        item.auctionId = savedAuction.id
        itemRepository.save(item)

        return savedAuction
    }

    @Transactional
    fun approveAuction(auctionId: UUID) {
        // Admin role already enforced by @PreAuthorize on the controller
        val auction = findById(auctionId)

        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Auction is not pending approval.")
        }

        val now = Instant.now()

        // Original requested duration must be valid
        val originalDurationSeconds = ChronoUnit.SECONDS.between(auction.startTime, auction.endTime)
        if (originalDurationSeconds <= 0) {
            throw BadRequestException("Auction duration must be greater than zero.")
        }

        // Small tolerance to avoid edge cases when approval happens "at start time"
        val activationToleranceSeconds = 5L
        val activateImmediatelyThreshold = now.plusSeconds(activationToleranceSeconds)

        if (!auction.startTime.isAfter(activateImmediatelyThreshold)) {
            // Requested start time is in the past OR now-ish => activate immediately
            auction.startTime = now
            auction.endTime = now.plusSeconds(originalDurationSeconds)
            auction.status = AuctionStatus.ACTIVE
            auction.item.status = ItemStatus.ACTIVE_AUCTION
        } else {
            // Start time is in the future => keep requested schedule
            auction.status = AuctionStatus.SCHEDULED
            auction.item.status = ItemStatus.LISTED_AUCTION
        }

        itemRepository.save(auction.item)
        auctionRepository.save(auction)
    }

    @Transactional
    fun cancelAuction(id: UUID) {
        val auction = findById(id)

        val currentUser = authorizationHelper.checkOwnerOrAdmin(auction.item.seller.id!!)
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        if (auction.status == AuctionStatus.ACTIVE && !isAdmin) {
            throw ConflictException("Cannot cancel an active auction. Contact support.")
        }

        if (auction.bidCount > 0 && !isAdmin) {
            throw ConflictException("Cannot cancel auction with existing bids. Contact support.")
        }

        auction.status = AuctionStatus.CANCELLED
        auction.item.status = ItemStatus.DRAFT
        auction.item.auctionId = null

        itemRepository.save(auction.item)
        auctionRepository.save(auction)
    }

    /**
     * Admin-only force cancel: bypasses ACTIVE and bid-count guards.
     * The controller must enforce @PreAuthorize("hasRole('ADMIN')") before calling this.
     */
    @Transactional
    fun adminForceCancelAuction(id: UUID) {
        val auction = findById(id)

        auction.status = AuctionStatus.CANCELLED
        auction.item.status = ItemStatus.DRAFT
        auction.item.auctionId = null

        itemRepository.save(auction.item)
        auctionRepository.save(auction)
        logger.info("Admin force-cancelled auction ${auction.id}")
    }

    @Transactional
    fun placeBid(auctionId: UUID, amount: BigDecimal): Bid {
        val currentUser = authorizationHelper.getCurrentUser()
        return placeBidAsUser(auctionId, currentUser.id!!, amount)
    }

    @Transactional
    fun placeBidAsUser(auctionId: UUID, bidderId: Long, maxAmount: BigDecimal): Bid {
        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }

        val now = Instant.now()
        if (auction.status != AuctionStatus.ACTIVE) throw BadRequestException("Auction is not active.")
        if (now.isAfter(auction.endTime)) throw BadRequestException("Auction has ended.")
        if (now.isBefore(auction.startTime)) throw BadRequestException("Auction has not started yet.")
        if (auction.item.seller.id == bidderId) throw ForbiddenException("You cannot bid on your own item.")

        val minRequired = if (auction.bidCount == 0) auction.startPrice else auction.currentPrice.add(auction.minBidIncrement)

        val currentWinnerId = auction.winningBid?.bidder?.id
        val currentMax = auction.winningBid?.maxAmount ?: BigDecimal.ZERO

        if (currentWinnerId == bidderId) {
            if (maxAmount <= currentMax) {
                throw BadRequestException("Your new max bid must be higher than your current max bid ($currentMax).")
            }
            val bidder = userRepository.findById(bidderId).orElseThrow { NotFoundException("User not found") }
            return recordBid(auction, bidder, auction.currentPrice, maxAmount, now)
        }

        if (maxAmount < minRequired) {
             throw BadRequestException("Bid amount too low. Minimum required: $minRequired")
        }

        // Allow any bid >= minRequired. Proxy bidding handles the rest.

        val bidder = userRepository.findById(bidderId).orElseThrow { NotFoundException("User not found") }

        if (auction.bidCount == 0) {
            return recordBid(auction, bidder, auction.startPrice, maxAmount, now)
        }

        if (maxAmount <= currentMax) {
            // New bidder is immediately outbid by current winner
            recordBid(auction, bidder, maxAmount, maxAmount, now)
            val nextIncrement = maxAmount.add(auction.minBidIncrement)
            val newPriceForA = if (currentMax >= nextIncrement) nextIncrement else currentMax
            return recordBid(auction, auction.winningBid!!.bidder, newPriceForA, currentMax, now.plusMillis(1))
        } else {
            // New bidder outbids current winner
            val prevWinner = auction.winningBid!!.bidder
            recordBid(auction, prevWinner, currentMax, currentMax, now)
            val nextIncrement = currentMax.add(auction.minBidIncrement)
            val newPriceForB = if (maxAmount >= nextIncrement) nextIncrement else maxAmount
            return recordBid(auction, bidder, newPriceForB, maxAmount, now.plusMillis(1))
        }
    }

    @Transactional
    fun placeNextMinimumBid(auctionId: UUID): Bid {
        val currentUser = authorizationHelper.getCurrentUser()

        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }

        val exactAmountToBid = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(auction.minBidIncrement)
        }

        // Delegate to the main proxy bidding function
        return placeBidAsUser(auctionId, currentUser.id!!, exactAmountToBid)
    }

    private fun recordBid(auction: Auction, bidder: User, amount: BigDecimal, maxAmount: BigDecimal, now: Instant): Bid {
        val secondsRemaining = ChronoUnit.SECONDS.between(now, auction.endTime)
        if (secondsRemaining < 120) auction.endTime = now.plus(120, ChronoUnit.SECONDS)

        val bid = Bid(
            auction = auction,
            bidder = bidder,
            amount = amount,
            bidTime = now,
            maxAmount = maxAmount
        )
        val savedBid = bidRepository.save(bid)

        auction.currentPrice = amount
        auction.bidCount += 1
        auction.winningBid = savedBid

        auctionRepository.save(auction)
        meterRegistry.counter("auction.bids.placed", "status", "success").increment()

        eventPublisher.publishEvent(BidPlacedEvent(auction, savedBid, bidder.username))

        return savedBid
    }

    fun processEndedAuctions() {
        val now = Instant.now()
        val pageRequest = PageRequest.of(0, 50)
        val expiredAuctions = auctionRepository.findAllByStatusAndEndTimeBefore(
            AuctionStatus.ACTIVE,
            now,
            pageRequest
        )

        expiredAuctions.forEach { auction ->
            try {
                auctionFinalizationService.finalizeAuction(auction.id!!)
            } catch (e: Exception) {
                logger.error("Failed to finalize auction ${auction.id}: ${e.message}", e)
            }
        }
    }

    fun processScheduledAuctions() {
        val now = Instant.now()
        val pageRequest = PageRequest.of(0, 50)

        val dueAuctions = auctionRepository.findAllByStatusAndStartTimeBefore(
            AuctionStatus.SCHEDULED,
            now,
            pageRequest
        )

        dueAuctions.forEach { auction ->
            try {
                auctionFinalizationService.activateScheduledAuction(auction.id!!)
            } catch (e: Exception) {
                logger.error("Failed to activate scheduled auction ${auction.id}: ${e.message}", e)
            }
        }
    }
}