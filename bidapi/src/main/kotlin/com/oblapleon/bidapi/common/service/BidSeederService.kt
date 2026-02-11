package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import net.datafaker.Faker
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
class BidSeederService(
    private val auctionRepository: AuctionRepository,
    private val userRepository: UserRepository,
    private val auctionService: AuctionService
) {
    private val faker = Faker()

    /**
     * Generates a specific number of new bids on currently ACTIVE auctions.
     * Uses the actual AuctionService.placeBid method to trigger WebSockets and validation.
     */
    fun seedLiveBids(count: Int) {
        // 1. Find Active Auctions
        val activeAuctions = auctionRepository.findAll().filter { it.status == AuctionStatus.ACTIVE }
        if (activeAuctions.isEmpty()) {
            throw IllegalStateException("No ACTIVE auctions found. Run /seed-auctions first.")
        }

        // 2. Find Bidders
        val users = userRepository.findAll()
        if (users.size < 2) {
            throw IllegalStateException("Not enough users to simulate bidding.")
        }

        var successCount = 0
        var failCount = 0

        // 3. Loop to place bids
        repeat(count) {
            val auction = activeAuctions.random()

            // Ensure bidder is not the seller
            val validBidders = users.filter { it.id != auction.item.seller.id }

            if (validBidders.isNotEmpty()) {
                val bidder = validBidders.random()

                // Calculate a valid bid amount (Current Price + Random Increment)
                // We add a random buffer (1.0 to 1.5x min increment) to make it look realistic
                val increment = auction.minBidIncrement.multiply(BigDecimal(faker.number().randomDouble(1, 1, 5)))
                val bidAmount = auction.currentPrice.add(increment)

                try {
                    // Call the real service method to trigger DB updates + WebSockets
                    auctionService.placeBid(auction.id!!, bidder.id!!, bidAmount)
                    successCount++

                    // Small sleep to ensure timestamps differ slightly in DB logs
                    Thread.sleep(50)
                } catch (e: Exception) {
                    println("Failed to seed bid: ${e.message}")
                    failCount++
                }
            }
        }

        println("Bid Seeding Complete: $successCount placed, $failCount failed.")
    }
}