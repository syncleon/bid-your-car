package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.exceptions.OwnItemBidException
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.feature.auction.dto.AuctionDto
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repo.AuctionRepo
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repo.BidRepo
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.access.AccessDeniedException
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*

@Component
class AuctionScheduler(private val auctionService: AuctionService) {
    @Scheduled(fixedRate = 60000)
    fun finalizeExpiredAuctions() {
        auctionService.processAllExpiredAuctions()
    }
}

@Service
@Transactional
class AuctionService(
    private val auctionRepo: AuctionRepo,
    private val bidRepo: BidRepo,
    private val itemRepo: ItemRepo,
    private val userRepo: UserRepo
) {

    @Transactional(readOnly = true)
    fun findById(id: UUID): Auction {
        return auctionRepo.findById(id).orElseThrow {
            NotFoundException("Auction with id $id not found.")
        }
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<AuctionDto> =
        auctionRepo.findAll(pageable).map { it.toDto() }

    @Transactional(readOnly = true)
    fun findByStatus(status: AuctionStatus, pageable: Pageable): Page<AuctionDto> =
        auctionRepo.findAllByStatus(status, pageable).map { it.toDto() }

    fun createAuction(sellerId: Long, dto: CreateAuctionDto): Auction {
        val item = itemRepo.findById(dto.itemId).orElseThrow { NotFoundException("Item not found") }

        if (item.seller.id != sellerId) throw UnauthorizedException("You do not own this item.")

        if (auctionRepo.isItemInActiveAuction(dto.itemId)) {
            throw IllegalStateException("Item is already in an active auction.")
        }

        val startLocal = LocalDateTime.ofInstant(dto.startTime, ZoneId.systemDefault())
        val endLocal = LocalDateTime.ofInstant(dto.endTime, ZoneId.systemDefault())

        if (endLocal.isBefore(startLocal)) {
            throw IllegalArgumentException("End time must be after start time")
        }

        val auction = Auction(
            item = item,
            startPrice = dto.startingBid,
            currentHighestBid = dto.startingBid,
            reservePrice = dto.reservePrice,
            minBidIncrement = dto.minBidIncrement,
            startTime = startLocal,
            endTime = endLocal,
            status = AuctionStatus.ACTIVE
        )

        item.auctions.add(auction)
        return auctionRepo.save(auction)
    }

    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = findById(auctionId)
        val bidder = userRepo.findById(bidderId).orElseThrow { NotFoundException("User not found.") }

        check(auction.status == AuctionStatus.ACTIVE) { "Auction is not active." }
        check(LocalDateTime.now().isBefore(auction.endTime)) { "Auction has ended." }
        check(auction.item.seller.id != bidderId) { throw OwnItemBidException("You cannot bid on your own item.") }

        val isFirstBid = auction.bids.isEmpty()
        val minRequired = if (isFirstBid) auction.startPrice
        else auction.currentHighestBid.add(auction.minBidIncrement)

        if (amount < minRequired) {
            throw IllegalArgumentException("Bid must be at least $minRequired")
        }

        val minutesRemaining = java.time.Duration.between(LocalDateTime.now(), auction.endTime).toMinutes()
        if (minutesRemaining < 2) {
            auction.endTime = auction.endTime.plusMinutes(5)
        }

        val bid = Bid(auction = auction, bidder = bidder, amount = amount, bidTime = LocalDateTime.now())
        val savedBid = bidRepo.save(bid)

        auction.currentHighestBid = amount
        auction.bids.add(savedBid)
        auctionRepo.save(auction)

        return savedBid
    }

    fun processAllExpiredAuctions() {
        val expired = auctionRepo.findAllByStatusAndEndTimeBefore(AuctionStatus.ACTIVE, LocalDateTime.now())
        expired.forEach { finalizeAuction(it) }
    }

    private fun finalizeAuction(auction: Auction) {
        val highestBid = auction.bids.maxByOrNull { it.amount }

        if (highestBid != null && (auction.reservePrice == null || highestBid.amount >= auction.reservePrice!!)) {
            auction.status = AuctionStatus.SOLD
            auction.winnerUser = highestBid.bidder
        } else {
            auction.status = AuctionStatus.EXPIRED
        }
        auctionRepo.save(auction)
    }

    @Transactional(readOnly = true)
    fun getEndingSoon(pageable: Pageable): Page<AuctionDto> {
        return auctionRepo.findByStatusAndEndTimeAfter(
            AuctionStatus.ACTIVE,
            LocalDateTime.now(),
            pageable
        ).map { it.toDto() }
    }

    @Transactional(readOnly = true)
    fun getAuctionsBySeller(sellerId: Long, pageable: Pageable): Page<AuctionDto> =
        auctionRepo.findAllByItemSellerId(sellerId, pageable).map { it.toDto() }

    @Transactional(readOnly = true)
    fun getAuctionsWonByUser(userId: Long, pageable: Pageable): Page<AuctionDto> =
        auctionRepo.findAllByWinnerUserIdAndStatus(userId, AuctionStatus.SOLD, pageable).map { it.toDto() }

    // ✅ FIX: Security check moved inside transaction to support Lazy Loading
    fun cancelAuction(id: UUID, initiator: User) {
        val auction = auctionRepo.findById(id).orElseThrow { NotFoundException("Auction not found") }

        // This traversal (auction -> item -> seller) is now safe because we are in a transaction
        val isOwner = auction.item.seller.id == initiator.id
        val isAdmin = initiator.roles.any { it.name == ERole.ADMIN }

        if (!isOwner && !isAdmin) {
            throw AccessDeniedException("You do not have permission to cancel this auction.")
        }

        if (auction.bids.isNotEmpty()) {
            throw IllegalStateException("Cannot delete auction with existing bids.")
        }

        auction.status = AuctionStatus.CANCELLED
        auctionRepo.save(auction)
    }
}