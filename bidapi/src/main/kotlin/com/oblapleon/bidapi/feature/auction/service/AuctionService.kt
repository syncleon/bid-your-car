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
import io.micrometer.core.instrument.MeterRegistry
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

@Service
class AuctionService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val meterRegistry: MeterRegistry
) {

    fun findById(id: UUID): Auction {
        return auctionRepository.findById(id)
            .orElseThrow { NotFoundException("Auction not found.") }
    }

    fun findPublicAuctions(filterType: String?, pageable: Pageable): Page<Auction> {
        val now = Instant.now()
        return when (filterType?.lowercase()) {
            "ending_soon" -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(AuctionStatus.ACTIVE, now, pageable)
            "just_listed" -> auctionRepository.findByStatusAndStartTimeBeforeOrderByStartTimeDesc(AuctionStatus.ACTIVE, now, pageable)
            else -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(AuctionStatus.ACTIVE, now, pageable)
        }
    }

    fun findBySeller(sellerId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllBySellerId(sellerId, pageable)
    }

    fun findWonByUser(userId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllWonByUserId(userId, pageable)
    }

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

    @Transactional
    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }
        val now = Instant.now()

        // 1. Basic Validation
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

        // 2. Self-Bid Prevention
        if (auction.winningBid?.bidder?.id == bidderId) {
            throw BadRequestException("You are already the highest bidder.")
        }

        val bidder = userRepository.findById(bidderId)
            .orElseThrow { NotFoundException("User account not found.") }

        // 3. Price Validation
        val minRequired = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(auction.minBidIncrement)
        }

        if (amount < minRequired) {
            throw BadRequestException("Bid amount too low. Minimum required: $minRequired")
        }

        // 4. Anti-Sniping (Soft Close)
        val secondsRemaining = ChronoUnit.SECONDS.between(now, auction.endTime)
        if (secondsRemaining < 120) {
            auction.endTime = now.plus(120, ChronoUnit.SECONDS)
        }

        val bid = Bid(
            auction = auction,
            bidder = bidder,
            amount = amount,
            bidTime = now,
            maxAmount = amount
        )
        val savedBid = bidRepository.save(bid)

        auction.currentPrice = amount
        auction.bidCount += 1
        auction.winningBid = savedBid

        auctionRepository.save(auction)

        meterRegistry.counter("auction.bids.placed", "status", "success").increment()

        try {
            val notification = BidNotificationDto(
                auctionId = auction.id!!,
                newPrice = auction.currentPrice,
                bidCount = auction.bidCount,
                bidderUsername = bidder.username,
                bidTime = savedBid.bidTime,
                newEndTime = auction.endTime
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", notification)

            val globalFeedItem = mapOf(
                "auctionId" to auction.id.toString(),
                "carName" to "${auction.item.year} ${auction.item.make} ${auction.item.model}",
                "newPrice" to auction.currentPrice,
                "bidder" to bidder.username,
                "timestamp" to savedBid.bidTime.toString()
            )
            messagingTemplate.convertAndSend("/topic/admin/bids/live", globalFeedItem)

        } catch (e: Exception) {
            System.err.println("Failed to send WebSocket notification: ${e.message}")
        }

        return savedBid
    }

    @Transactional
    fun placeNextMinimumBid(auctionId: UUID, bidderId: Long): Bid {
        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }
        val now = Instant.now()

        // 1. Basic Validation
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

        // 2. Self-Bid Prevention
        if (auction.winningBid?.bidder?.id == bidderId) {
            throw BadRequestException("You are already the highest bidder.")
        }

        val bidder = userRepository.findById(bidderId)
            .orElseThrow { NotFoundException("User account not found.") }

        // 3. Price Calculation
        val exactAmountToBid = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(auction.minBidIncrement)
        }

        // 4. Anti-Sniping (Soft Close)
        val secondsRemaining = ChronoUnit.SECONDS.between(now, auction.endTime)
        if (secondsRemaining < 120) {
            auction.endTime = now.plus(120, ChronoUnit.SECONDS)
        }

        val bid = Bid(
            auction = auction,
            bidder = bidder,
            amount = exactAmountToBid,
            bidTime = now,
            maxAmount = exactAmountToBid
        )
        val savedBid = bidRepository.save(bid)

        auction.currentPrice = exactAmountToBid
        auction.bidCount += 1
        auction.winningBid = savedBid

        auctionRepository.save(auction)

        meterRegistry.counter("auction.bids.placed", "status", "success").increment()

        try {
            val notification = BidNotificationDto(
                auctionId = auction.id!!,
                newPrice = auction.currentPrice,
                bidCount = auction.bidCount,
                bidderUsername = bidder.username,
                bidTime = savedBid.bidTime,
                newEndTime = auction.endTime
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", notification)

            val globalFeedItem = mapOf(
                "auctionId" to auction.id.toString(),
                "carName" to "${auction.item.year} ${auction.item.make} ${auction.item.model}",
                "newPrice" to auction.currentPrice,
                "bidder" to bidder.username,
                "timestamp" to savedBid.bidTime.toString()
            )
            messagingTemplate.convertAndSend("/topic/admin/bids/live", globalFeedItem)

        } catch (e: Exception) {
            System.err.println("Failed to send WebSocket notification: ${e.message}")
        }

        return savedBid
    }

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

        try {
            val finalNotification = mapOf(
                "auctionId" to auction.id.toString(),
                "status" to auction.status.name,
                "finalPrice" to auction.currentPrice,
                "winner" to (auction.winnerUser?.username ?: "No Winner")
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", finalNotification)
        } catch (e: Exception) {
            System.err.println("Failed to send auction closed notification: ${e.message}")
        }
    }
}