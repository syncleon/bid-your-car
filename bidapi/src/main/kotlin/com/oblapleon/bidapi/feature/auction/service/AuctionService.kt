package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exception.*
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.dto.BidNotificationDto
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

/**
 * Service responsible for the complete lifecycle of an auction.
 * Handles creation, approval, bidding logic, anti-sniping protection,
 * and final settlement (Sold/Unsold).
 */
@Service
class AuctionService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {

    /**
     * Retrieves an auction by its unique identifier.
     *
     * @param id The UUID of the auction.
     * @return The Auction entity.
     * @throws NotFoundException if the auction does not exist.
     */
    fun findById(id: UUID): Auction {
        return auctionRepository.findById(id)
            .orElseThrow { NotFoundException("Auction not found.") }
    }

    /**
     * Retrieves a paginated list of active auctions for the public feed.
     * Supports filtering logic for widgets like "Ending Soon" or "Just Listed".
     *
     * @param filterType Optional filter string ("ending_soon", "just_listed").
     * @param pageable Pagination information.
     * @return A page of active Auction entities.
     */
    fun findPublicAuctions(filterType: String?, pageable: Pageable): Page<Auction> {
        val now = Instant.now()
        return when (filterType?.lowercase()) {
            "ending_soon" -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(AuctionStatus.ACTIVE, now, pageable)
            "just_listed" -> auctionRepository.findByStatusAndStartTimeBeforeOrderByStartTimeDesc(AuctionStatus.ACTIVE, now, pageable)
            else -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(AuctionStatus.ACTIVE, now, pageable)
        }
    }

    /**
     * Retrieves all auctions created by a specific seller.
     *
     * @param sellerId The ID of the seller.
     * @param pageable Pagination information.
     * @return A page of auctions.
     */
    fun findBySeller(sellerId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllBySellerId(sellerId, pageable)
    }

    /**
     * Retrieves all auctions won by a specific user.
     *
     * @param userId The ID of the winning user.
     * @param pageable Pagination information.
     * @return A page of won auctions.
     */
    fun findWonByUser(userId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllWonByUserId(userId, pageable)
    }

    /**
     * Creates a new auction in PENDING_APPROVAL state.
     *
     * @param sellerId The ID of the user requesting the auction.
     * @param request The auction details (dates, pricing).
     * @return The created Auction entity.
     * @throws ForbiddenException if the user does not own the item.
     * @throws ConflictException if the item is already listed in another active auction.
     * @throws BadRequestException if the start/end times are invalid.
     */
    @Transactional
    fun createAuction(sellerId: Long, request: CreateAuctionDto): Auction {
        val item = itemRepository.findById(request.itemId)
            .orElseThrow { NotFoundException("Item not found") }

        if (item.seller.id != sellerId) {
            throw ForbiddenException("You do not own this item.")
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
            reservePrice = request.reservePrice,
            minBidIncrement = request.minBidIncrement,
            startTime = request.startTime,
            endTime = request.endTime,
            status = AuctionStatus.PENDING_APPROVAL
        )

        return auctionRepository.save(auction)
    }

    /**
     * Admin operation to approve a pending auction.
     * If the scheduled start time has already passed, the start time is reset to NOW,
     * and the end time is shifted to preserve the original duration.
     *
     * @param auctionId The UUID of the auction to approve.
     * @throws ConflictException if the auction is not in PENDING_APPROVAL state.
     */
    @Transactional
    fun approveAuction(auctionId: UUID) {
        val auction = findById(auctionId)

        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Auction is not pending approval.")
        }

        val now = Instant.now()

        if (auction.startTime.isBefore(now)) {
            val originalDuration = ChronoUnit.SECONDS.between(auction.startTime, auction.endTime)
            auction.startTime = now
            auction.endTime = now.plus(originalDuration, ChronoUnit.SECONDS)
            auction.status = AuctionStatus.ACTIVE
        } else {
            auction.status = AuctionStatus.SCHEDULED
        }

        auctionRepository.save(auction)
    }

    /**
     * Cancels an auction. Can be performed by the owner (if no bids exist) or an Admin (anytime).
     *
     * @param id The UUID of the auction.
     * @param initiatorId The ID of the user attempting to cancel.
     * @param isAdmin Boolean flag indicating if the initiator is an admin.
     * @throws ForbiddenException if the user is not the owner or an admin.
     * @throws ConflictException if a non-admin tries to cancel an auction with existing bids.
     */
    @Transactional
    fun cancelAuction(id: UUID, initiatorId: Long, isAdmin: Boolean) {
        val auction = findById(id)
        val isOwner = auction.item.seller.id == initiatorId

        if (!isOwner && !isAdmin) {
            throw ForbiddenException("You do not have permission to cancel this auction.")
        }

        if (auction.bidCount > 0 && !isAdmin) {
            throw ConflictException("Cannot cancel auction with existing bids. Contact support.")
        }

        auction.status = AuctionStatus.CANCELLED
        auctionRepository.save(auction)
    }

    /**
     * Places a bid on an active auction.
     * Implements validation, price calculation, and anti-sniping logic (extends auction by 5 minutes
     * if a bid is placed within the last 2 minutes).
     *
     * @param auctionId The UUID of the auction.
     * @param bidderId The ID of the user placing the bid.
     * @param amount The bid amount.
     * @return The persisted Bid entity.
     * @throws BadRequestException if the auction is not active, time has ended, or bid amount is too low.
     * @throws ForbiddenException if the user tries to bid on their own item.
     */
    @Transactional
    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = findById(auctionId)
        val now = Instant.now()

        // 1. Validation Logic
        if (auction.status != AuctionStatus.ACTIVE) {
            throw BadRequestException("Auction is not active.")
        }
        if (now.isAfter(auction.endTime)) {
            throw BadRequestException("Auction has ended.")
        }
        if (now.isBefore(auction.startTime)) {
            throw BadRequestException("Auction has not started yet.")
        }
        if (auction.item.seller.id == bidderId) {
            throw ForbiddenException("You cannot bid on your own item.")
        }

        val bidder = userRepository.findById(bidderId)
            .orElseThrow { NotFoundException("User account not found.") }

        // 2. Price Check
        val minRequired = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(auction.minBidIncrement)
        }

        if (amount < minRequired) {
            throw BadRequestException("Bid amount too low. Minimum required: $minRequired")
        }

        // 3. Anti-Sniping (Extend if < 2 mins remaining)
        val secondsRemaining = ChronoUnit.SECONDS.between(now, auction.endTime)
        if (secondsRemaining < 120) {
            auction.endTime = auction.endTime.plus(300, ChronoUnit.SECONDS)
        }

        // 4. Save Bid
        val bid = Bid(
            auction = auction,
            bidder = bidder,
            amount = amount,
            bidTime = now,
            maxAmount = amount // Default max amount for simple bidding
        )
        val savedBid = bidRepository.save(bid)

        // 5. Update Auction
        auction.currentPrice = amount
        auction.bidCount += 1
        auction.winningBid = savedBid

        auctionRepository.save(auction)

        // 6. ✅ BROADCAST VIA WEBSOCKET
        // Sends JSON to anyone subscribed to "/topic/auctions/{uuid}"
        try {
            val notification = BidNotificationDto(
                auctionId = auction.id!!,
                newPrice = auction.currentPrice,
                bidCount = auction.bidCount,
                bidderUsername = bidder.username, // Mask this in real app if needed
                bidTime = savedBid.bidTime
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", notification)
        } catch (e: Exception) {
            // Log error but don't fail the transaction just because WS failed
            System.err.println("Failed to send WebSocket notification: ${e.message}")
        }

        return savedBid
    }

    /**
     * Batch job to identify auctions that have passed their end time but are still marked ACTIVE.
     * Processes them in batches of 50 to avoid memory issues.
     */
    @Transactional
    fun processEndedAuctions() {
        val now = Instant.now()
        val pageRequest = PageRequest.of(0, 50)
        val expiredAuctions = auctionRepository.findAllByStatusAndEndTimeBefore(
            AuctionStatus.ACTIVE,
            now,
            pageRequest
        )

        expiredAuctions.forEach { auction ->
            finalizeAuction(auction)
        }
    }

    /**
     * Determines the final state of an ended auction.
     * Sets status to SOLD if reserve is met, otherwise UNSOLD.
     */
    private fun finalizeAuction(auction: Auction) {
        if (auction.bidCount > 0) {
            val highestBid = auction.winningBid ?: bidRepository.findTopByAuctionOrderByAmountDesc(auction)
            val reserve = auction.reservePrice

            if (reserve == null || (highestBid != null && highestBid.amount >= reserve)) {
                auction.status = AuctionStatus.SOLD
                auction.winnerUser = highestBid?.bidder
            } else {
                auction.status = AuctionStatus.UNSOLD
            }
        } else {
            auction.status = AuctionStatus.UNSOLD
        }

        auctionRepository.save(auction)
    }
}