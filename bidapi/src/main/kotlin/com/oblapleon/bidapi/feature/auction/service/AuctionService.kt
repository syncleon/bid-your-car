package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.common.service.BaseService
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repo.AuctionRepo
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repo.BidRepo
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.*

@Service
class AuctionService(
    private val auctionRepo: AuctionRepo,
    private val bidRepo: BidRepo,
    private val itemRepo: ItemRepo,
    private val userRepo: UserRepo
) : BaseService<Auction, UUID> {

    override fun findById(id: UUID): Auction {
        return auctionRepo.findById(id).orElseThrow {
            NotFoundException("Auction with id $id not found.")
        }
    }

    override fun findAll(): List<Auction> = auctionRepo.findAll()

    fun findActiveAuctions(): List<Auction> = auctionRepo.findAllByStatus(AuctionStatus.ACTIVE)

    fun findAuctionsByStatus(status: AuctionStatus): List<Auction> = auctionRepo.findAllByStatus(status)

    @Transactional
    fun createAuction(
        itemId: UUID,
        startPrice: BigDecimal,
        durationHours: Long,
        reservePrice: BigDecimal?,
        sellerId: Long
    ): Auction {
        val item = itemRepo.findById(itemId).orElseThrow { NotFoundException("Item not found") }

        if (item.seller.id != sellerId) throw UnauthorizedException("You do not own this item.")

        check(!auctionRepo.isItemInActiveAuction(itemId)) { "Item is already in an active auction." }
        require(startPrice >= BigDecimal.ZERO) { "Start price cannot be negative." }

        val auction = Auction(
            item = item,
            startPrice = startPrice,
            currentHighestBid = startPrice,
            reservePrice = reservePrice,
            startTime = LocalDateTime.now(),
            endTime = LocalDateTime.now().plusHours(durationHours),
            status = AuctionStatus.ACTIVE
        )

        return auctionRepo.save(auction)
    }

    @Transactional
    fun placeBid(auctionId: UUID, bidderId: Long, amount: BigDecimal): Bid {
        val auction = findById(auctionId)
        val bidder = userRepo.findById(bidderId).orElseThrow { NotFoundException("User not found.") }

        // Logic Validations
        check(auction.status == AuctionStatus.ACTIVE) { "Auction is ${auction.status}, not active." }
        check(LocalDateTime.now().isBefore(auction.endTime)) { "Auction has already ended." }
        check(auction.item.seller.id != bidderId) { "You cannot bid on your own item." }

        val minRequired = if (auction.bids.isEmpty()) auction.startPrice
        else auction.currentHighestBid.add(auction.minBidIncrement)

        require(amount >= minRequired) { "Bid must be at least $minRequired" }

        // Anti-Sniping: If bid is placed in last 2 minutes, extend by 5 minutes
        val timeRemaining = java.time.Duration.between(LocalDateTime.now(), auction.endTime).toMinutes()
        if (timeRemaining < 2) {
            auction.endTime = auction.endTime.plusMinutes(5)
        }

        val bid = Bid(auction = auction, bidder = bidder, amount = amount, bidTime = LocalDateTime.now())
        val savedBid = bidRepo.save(bid)

        auction.currentHighestBid = amount
        auction.bids.add(savedBid)
        auctionRepo.save(auction)

        return savedBid
    }

    @Transactional
    fun finalizeAuction(auctionId: UUID) {
        val auction = findById(auctionId)
        if (auction.status != AuctionStatus.ACTIVE) return

        val now = LocalDateTime.now()
        check(now.isAfter(auction.endTime)) { "Cannot finalize an auction that hasn't ended yet." }

        val highestBid = auction.bids.maxByOrNull { it.amount }

        if (highestBid != null && (auction.reservePrice == null || highestBid.amount >= auction.reservePrice!!)) {
            auction.status = AuctionStatus.SOLD
            auction.winnerUser = highestBid.bidder
        } else {
            auction.status = AuctionStatus.EXPIRED
        }
        auctionRepo.save(auction)
    }

    /**
     * For use by a Background Scheduler to process all ended auctions.
     */
    @Transactional
    fun processAllExpiredAuctions() {
        val expired = auctionRepo.findAllByStatusAndEndTimeBefore(AuctionStatus.ACTIVE, LocalDateTime.now())
        expired.forEach { finalizeAuction(it.id!!) }
    }

    fun getEndingSoon(limit: Int): List<Auction> {
        return auctionRepo.findByStatusAndEndTimeAfterOrderByEndTimeAsc(
            AuctionStatus.ACTIVE, LocalDateTime.now()
        ).take(limit)
    }

    fun getAuctionsBySeller(sellerId: Long): List<Auction> = auctionRepo.findAllByItemSellerId(sellerId)

    fun getAuctionsWonByUser(userId: Long): List<Auction> = auctionRepo.findAllByWinnerUserIdAndStatus(userId, AuctionStatus.SOLD)

    @Transactional
    fun updateIncrement(auctionId: UUID, increment: BigDecimal) {
        val auction = findById(auctionId)
        require(increment > BigDecimal.ZERO) { "Increment must be positive." }
        auction.minBidIncrement = increment
        auctionRepo.save(auction)
    }

    override fun delete(id: UUID) {
        val auction = findById(id)
        if (auction.bids.isNotEmpty()) {
            throw IllegalStateException("Cannot delete auction with existing bids. Cancel it instead.")
        }
        auction.status = AuctionStatus.CANCELLED
        auctionRepo.save(auction)
    }
}