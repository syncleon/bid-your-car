package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exceptions.*
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
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Duration
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*

@Component
class AuctionScheduler(private val auctionService: AuctionService) {
    @Scheduled(fixedRate = 60000) // Runs every minute
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

    // ==========================================
    // READ OPERATIONS
    // ==========================================

    @Transactional(readOnly = true)
    fun findById(id: UUID): Auction {
        return auctionRepo.findById(id).orElseThrow { NotFoundException("Auction not found.") }
    }

    @Transactional(readOnly = true)
    fun findPublicAuctions(status: AuctionStatus?, sellerId: Long?, pageable: Pageable): Page<AuctionDto> {
        return when {
            sellerId != null -> auctionRepo.findAllByItemSellerId(sellerId, pageable)
            // If no specific status requested, ONLY return ACTIVE (hide pending/rejected from public)
            status != null -> auctionRepo.findAllByStatus(status, pageable)
            else -> auctionRepo.findAllByStatus(AuctionStatus.ACTIVE, pageable)
        }.map { it.toDto() }
    }

    @Transactional(readOnly = true)
    fun findPendingAuctions(pageable: Pageable): Page<AuctionDto> {
        return auctionRepo.findAllByStatus(AuctionStatus.PENDING_APPROVAL, pageable).map { it.toDto() }
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
    fun getAuctionsWonByUser(userId: Long, pageable: Pageable): Page<AuctionDto> {
        return auctionRepo.findAllByWinnerUserIdAndStatus(userId, AuctionStatus.SOLD, pageable).map { it.toDto() }
    }

    fun getWinningBid(auctionId: UUID): Bid? {
        val auction = findById(auctionId)
        if (auction.status != AuctionStatus.SOLD) return null
        return bidRepo.findTopByAuctionIdOrderByAmountDesc(auctionId)
    }

    // ==========================================
    // WRITE OPERATIONS - LIFECYCLE
    // ==========================================

    fun createAuction(sellerId: Long, dto: CreateAuctionDto): Auction {
        val item = itemRepo.findById(dto.itemId).orElseThrow { NotFoundException("Item not found") }

        if (item.seller.id != sellerId) throw UnauthorizedException("You do not own this item.")
        if (auctionRepo.isItemInActiveAuction(dto.itemId)) throw ConflictException("Item is already in an active auction.")

        val startLocal = LocalDateTime.ofInstant(dto.startTime, ZoneId.systemDefault())
        val endLocal = LocalDateTime.ofInstant(dto.endTime, ZoneId.systemDefault())

        if (endLocal.isBefore(startLocal)) throw IllegalArgumentException("End time must be after start time")

        // Create with PENDING_APPROVAL status
        val auction = Auction(
            item = item,
            startPrice = dto.startingBid,
            currentHighestBid = dto.startingBid,
            reservePrice = dto.reservePrice,
            minBidIncrement = dto.minBidIncrement,
            startTime = startLocal,
            endTime = endLocal,
            status = AuctionStatus.PENDING_APPROVAL
        )

        item.auctions.add(auction)
        return auctionRepo.save(auction)
    }

    fun approveAuction(auctionId: UUID) {
        val auction = findById(auctionId)

        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Auction is not pending approval. Current status: ${auction.status}")
        }

        // 1. Calculate the User's originally requested duration
        val requestedDuration = Duration.between(auction.startTime, auction.endTime)

        // 2. Reset the clock to NOW so they get the full time they asked for
        val now = LocalDateTime.now()
        auction.startTime = now
        auction.endTime = now.plus(requestedDuration)

        // 3. Publish
        auction.status = AuctionStatus.ACTIVE
        auctionRepo.save(auction)
    }

    fun rejectAuction(auctionId: UUID) {
        val auction = findById(auctionId)
        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Only pending auctions can be rejected.")
        }
        auction.status = AuctionStatus.REJECTED
        auctionRepo.save(auction)
    }

    fun cancelAuction(id: UUID, initiator: User) {
        val auction = findById(id)
        val isOwner = auction.item.seller.id == initiator.id
        val isAdmin = initiator.roles.any { it.name == ERole.ADMIN }

        if (!isOwner && !isAdmin) throw UnauthorizedException("Permission denied.")

        // Logic: Cannot cancel if bids exist (unless extreme admin override, but typically no)
        if (auction.bids.isNotEmpty()) throw ConflictException("Cannot cancel auction with existing bids.")

        auction.status = AuctionStatus.CANCELLED
        auctionRepo.save(auction)
    }

    // ==========================================
    // WRITE OPERATIONS - BIDDING
    // ==========================================

    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = findById(auctionId)

        // 1. Validations
        check(auction.status == AuctionStatus.ACTIVE) { "Auction is not active." }
        check(LocalDateTime.now().isBefore(auction.endTime)) { "Auction has ended." }
        check(auction.item.seller.id != bidderId) { throw OwnItemBidException("Cannot bid on your own item.") }

        // 2. Amount Calculation
        val minRequired = if (auction.bids.isEmpty()) auction.startPrice
        else auction.currentHighestBid.add(auction.minBidIncrement)

        if (amount < minRequired) throw IllegalArgumentException("Bid too low. Minimum is $minRequired")

        // 3. Anti-Sniping (Extend time if bid is near end)
        val minutesRemaining = Duration.between(LocalDateTime.now(), auction.endTime).toMinutes()
        if (minutesRemaining < 2) {
            auction.endTime = auction.endTime.plusMinutes(5)
        }

        // 4. Save Bid
        val bidder = userRepo.findById(bidderId).orElseThrow { NotFoundException("User not found") }
        val bid = Bid(auction = auction, bidder = bidder, amount = amount, bidTime = LocalDateTime.now())

        auction.currentHighestBid = amount
        auction.bids.add(bid)

        // Note: Ideally, save bid first, then auction, or use CascadeType.ALL carefully
        val savedBid = bidRepo.save(bid)
        auctionRepo.save(auction)

        return savedBid
    }

    // ==========================================
    // SCHEDULED TASKS
    // ==========================================

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
}