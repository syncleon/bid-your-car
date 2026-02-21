package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exception.*
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.dto.BidNotificationDto
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
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
    private val meterRegistry: MeterRegistry,
    private val authorizationHelper: AuthorizationHelper,
    private val auctionFinalizationService: AuctionFinalizationService
) {

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

        item.status = ItemStatus.PENDING_AUCTION
        itemRepository.save(item)

        return auctionRepository.save(auction)
    }

    @Transactional
    fun approveAuction(auctionId: UUID) {
        val currentUser = authorizationHelper.getCurrentUser()
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        if (!isAdmin) {
            throw ForbiddenException("Only administrators can approve auctions.")
        }

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

            auction.item.status = ItemStatus.ACTIVE_AUCTION
        } else {
            auction.status = AuctionStatus.SCHEDULED
            auction.item.status = ItemStatus.LISTED_AUCTION
        }

        itemRepository.save(auction.item)
        auctionRepository.save(auction)
    }

    @Transactional
    fun cancelAuction(id: UUID) {
        val auction = findById(id)

        // This validates that the requester is the item owner or an admin
        val currentUser = authorizationHelper.checkOwnerOrAdmin(auction.item.seller.id!!)
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }

        if (auction.bidCount > 0 && !isAdmin) {
            throw ConflictException("Cannot cancel auction with existing bids. Contact support.")
        }

        auction.status = AuctionStatus.CANCELLED

        auction.item.status = ItemStatus.DRAFT
        itemRepository.save(auction.item)

        auctionRepository.save(auction)
    }

    @Transactional
    fun placeBid(auctionId: UUID, amount: BigDecimal): Bid {
        val currentUser = authorizationHelper.getCurrentUser()
        return placeBidAsUser(auctionId, currentUser.id!!, amount)
    }

    @Transactional
    fun placeBidAsUser(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }
        val now = Instant.now()

        if (auction.status != AuctionStatus.ACTIVE) throw BadRequestException("Auction is not active.")
        if (now.isAfter(auction.endTime)) throw BadRequestException("Auction has ended.")
        if (now.isBefore(auction.startTime)) throw BadRequestException("Auction has not started yet.")
        if (auction.item.seller.id == bidderId) throw ForbiddenException("You cannot bid on your own item.")
        if (auction.winningBid?.bidder?.id == bidderId) throw BadRequestException("You are already the highest bidder.")

        val bidder = userRepository.findById(bidderId)
            .orElseThrow { NotFoundException("User account not found.") }

        val minRequired = if (auction.bidCount == 0) auction.startPrice else auction.currentPrice.add(auction.minBidIncrement)
        if (amount < minRequired) throw BadRequestException("Bid amount too low. Minimum required: $minRequired")

        val secondsRemaining = ChronoUnit.SECONDS.between(now, auction.endTime)
        if (secondsRemaining < 120) auction.endTime = now.plus(120, ChronoUnit.SECONDS)

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

        dispatchBidNotifications(auction, savedBid, bidder.username)

        return savedBid
    }

    @Transactional
    fun placeNextMinimumBid(auctionId: UUID): Bid {
        val currentUser = authorizationHelper.getCurrentUser()

        val auction = auctionRepository.findByIdWithPessimisticWriteLock(auctionId)
            .orElseThrow { NotFoundException("Auction not found.") }
        val now = Instant.now()

        if (auction.status != AuctionStatus.ACTIVE) {
            throw BadRequestException("Auction is not active.")
        }
        if (now.isAfter(auction.endTime)) {
            throw BadRequestException("Auction has ended.")
        }
        if (now.isBefore(auction.startTime)) {
            throw BadRequestException("Auction has not started yet.")
        }
        if (auction.item.seller.id == currentUser.id) {
            throw ForbiddenException("You cannot bid on your own item.")
        }
        if (auction.winningBid?.bidder?.id == currentUser.id) {
            throw BadRequestException("You are already the highest bidder.")
        }

        val bidder = userRepository.findById(currentUser.id!!)
            .orElseThrow { NotFoundException("User account not found.") }

        val exactAmountToBid = if (auction.bidCount == 0) {
            auction.startPrice
        } else {
            auction.currentPrice.add(auction.minBidIncrement)
        }

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

        dispatchBidNotifications(auction, savedBid, bidder.username)

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
                System.err.println("Failed to finalize auction ${auction.id}: ${e.message}")
            }
        }
    }

    private fun dispatchBidNotifications(auction: Auction, savedBid: Bid, bidderUsername: String) {
        try {
            val notification = BidNotificationDto(
                auctionId = auction.id!!,
                newPrice = auction.currentPrice,
                bidCount = auction.bidCount,
                bidderUsername = bidderUsername,
                bidTime = savedBid.bidTime,
                newEndTime = auction.endTime
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", notification)

            val globalFeedItem = mapOf(
                "auctionId" to auction.id.toString(),
                "carName" to "${auction.item.year} ${auction.item.make} ${auction.item.model}",
                "newPrice" to auction.currentPrice,
                "bidder" to bidderUsername,
                "timestamp" to savedBid.bidTime.toString()
            )
            messagingTemplate.convertAndSend("/topic/admin/bids/live", globalFeedItem)
        } catch (e: Exception) {
            System.err.println("Failed to send WebSocket notification: ${e.message}")
        }
    }
}