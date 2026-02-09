package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repo.AuctionRepo
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repo.BidRepo
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import net.datafaker.Faker
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.concurrent.TimeUnit

@Service
class AuctionSeederService(
    private val auctionRepo: AuctionRepo,
    private val itemRepo: ItemRepo,
    private val userRepo: UserRepo,
    private val bidRepo: BidRepo
) {
    private val faker = Faker()

    @Transactional
    fun seedAuctions(count: Int) {
        // 1. Fetch items that don't have auctions yet
        val items = itemRepo.findItemsWithoutAuctions(PageRequest.of(0, count))
        
        if (items.isEmpty()) {
            throw IllegalStateException("No available items found to create auctions. Run /seed-items first.")
        }

        val users = userRepo.findAll()
        if (users.size < 2) {
            throw IllegalStateException("Need at least 2 users to simulate bidding.")
        }

        items.forEach { item ->
            // Randomly decide the fate of this auction
            val status = faker.options().option(AuctionStatus::class.java)
            
            // Base price between 5k and 50k
            val startPrice = BigDecimal(faker.number().numberBetween(5000, 50000))
            
            val auction = Auction(
                item = item,
                startPrice = startPrice,
                currentHighestBid = startPrice,
                minBidIncrement = BigDecimal(100), // Standard increment
                reservePrice = if (faker.bool().bool()) startPrice.multiply(BigDecimal(1.2)) else null,
                status = status,
                startTime = LocalDateTime.now(), // Placeholder, set below
                endTime = LocalDateTime.now()    // Placeholder, set below
            )

            // Configure dates and bids based on status
            when (status) {
                AuctionStatus.ACTIVE -> {
                    // Started 2 days ago, ends in 2 days
                    auction.startTime = LocalDateTime.now().minusDays(faker.number().numberBetween(1L, 5L))
                    auction.endTime = LocalDateTime.now().plusDays(faker.number().numberBetween(1L, 5L))
                    auctionRepo.save(auction)
                    generateFakeBids(auction, users, 3, 15) // Active auctions have some bids
                }
                AuctionStatus.SOLD -> {
                    // Started 10 days ago, ended 2 days ago
                    auction.startTime = LocalDateTime.now().minusDays(10)
                    auction.endTime = LocalDateTime.now().minusDays(2)
                    auctionRepo.save(auction)
                    
                    // Must have bids to be sold
                    val winner = generateFakeBids(auction, users, 5, 20)
                    auction.winnerUser = winner
                    auctionRepo.save(auction)
                }
                AuctionStatus.EXPIRED -> {
                    // Started 20 days ago, ended 10 days ago
                    auction.startTime = LocalDateTime.now().minusDays(20)
                    auction.endTime = LocalDateTime.now().minusDays(10)
                    auctionRepo.save(auction)
                    // Maybe 0 bids, or bids below reserve
                    if (faker.bool().bool()) {
                        generateFakeBids(auction, users, 1, 3) 
                    }
                }
                AuctionStatus.PENDING_APPROVAL -> {
                    // Starts in the future
                    auction.startTime = LocalDateTime.now().plusDays(1)
                    auction.endTime = LocalDateTime.now().plusDays(5)
                    auctionRepo.save(auction)
                }
                else -> { // REJECTED, CANCELLED
                    auction.startTime = LocalDateTime.now().minusDays(5)
                    auction.endTime = LocalDateTime.now().minusDays(1)
                    auctionRepo.save(auction)
                }
            }
        }
    }

    private fun generateFakeBids(auction: Auction, allUsers: List<com.oblapleon.bidapi.feature.user.entity.User>, minBids: Int, maxBids: Int): com.oblapleon.bidapi.feature.user.entity.User? {
        val bidCount = faker.number().numberBetween(minBids, maxBids)
        var currentBidAmount = auction.startPrice
        var lastBidder: com.oblapleon.bidapi.feature.user.entity.User? = null

        // Calculate time steps to spread bids out
        val durationSeconds = java.time.Duration.between(auction.startTime, 
            if(auction.endTime.isBefore(LocalDateTime.now())) auction.endTime else LocalDateTime.now()
        ).seconds
        val timeStep = durationSeconds / (bidCount + 1)

        val bids = mutableListOf<Bid>()

        for (i in 1..bidCount) {
            // Pick a random user who IS NOT the seller
            val potentialBidders = allUsers.filter { it.id != auction.item.seller.id }
            if (potentialBidders.isEmpty()) break
            
            val bidder = potentialBidders.random()
            
            // Increment bid
            val increment = BigDecimal(faker.number().numberBetween(100, 500))
            currentBidAmount = currentBidAmount.add(increment)

            // Time logic: spread bids from start time
            val bidTime = auction.startTime.plusSeconds(timeStep * i)

            bids.add(Bid(
                auction = auction,
                bidder = bidder,
                amount = currentBidAmount,
                bidTime = bidTime
            ))
            
            lastBidder = bidder
        }

        if (bids.isNotEmpty()) {
            bidRepo.saveAll(bids)
            auction.currentHighestBid = currentBidAmount
            // Don't save auction here, let parent method save it to avoid transaction issues
        }
        
        return lastBidder
    }
}