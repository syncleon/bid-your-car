package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import net.datafaker.Faker
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class AuctionSeederService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository
) {
    private val faker = Faker()

    @Transactional
    fun seedAuctions(count: Int) {
        // 1. Fetch items that are ready for auction (AVAILABLE and no existing auctions)
        // Note: Assuming findReadyForAuction exists in ItemRepository as defined previously
        val page = itemRepository.findReadyForAuction(PageRequest.of(0, count))
        val items = page.content

        if (items.isEmpty()) {
            throw IllegalStateException("No available items found to create auctions. Please seed items first.")
        }

        val users = userRepository.findAll()
        if (users.size < 2) {
            throw IllegalStateException("Need at least 2 users in DB to simulate bidding.")
        }

        items.forEach { item ->
            createRandomAuction(item, users)
        }
    }

    private fun createRandomAuction(item: Item, allUsers: List<User>) {
        // 1. Determine Status
        val status = faker.options().option(AuctionStatus::class.java)

        // 2. Pricing
        val startPrice = BigDecimal(faker.number().numberBetween(5000, 50000))
        val hasReserve = faker.bool().bool()
        val reservePrice = if (hasReserve) startPrice.multiply(BigDecimal("1.2")) else null

        // 3. Timing (Base)
        val now = Instant.now()
        var startTime = now
        var endTime = now.plus(7, ChronoUnit.DAYS)

        // Adjust timing based on status
        when (status) {
            AuctionStatus.ACTIVE -> {
                startTime = now.minus(faker.number().numberBetween(1L, 3L), ChronoUnit.DAYS)
                endTime = now.plus(faker.number().numberBetween(1L, 4L), ChronoUnit.DAYS)
            }
            AuctionStatus.SOLD, AuctionStatus.UNSOLD -> {
                startTime = now.minus(10, ChronoUnit.DAYS)
                endTime = now.minus(2, ChronoUnit.DAYS)
            }
            AuctionStatus.SCHEDULED -> {
                startTime = now.plus(2, ChronoUnit.DAYS)
                endTime = now.plus(9, ChronoUnit.DAYS)
            }
            else -> { /* PENDING, DRAFT, etc. keep default */ }
        }

        // 4. Create Auction Entity
        val auction = Auction(
            item = item,
            startPrice = startPrice,
            currentPrice = startPrice, // Initially equals start price
            minBidIncrement = BigDecimal("100.00"),
            reservePrice = reservePrice,
            startTime = startTime,
            endTime = endTime,
            status = status,
            bidCount = 0
        )

        // Save first to get an ID
        auctionRepository.save(auction)

        // 5. Generate Bids (only for relevant statuses)
        if (status == AuctionStatus.ACTIVE || status == AuctionStatus.SOLD || status == AuctionStatus.UNSOLD) {
            val shouldHaveBids = if (status == AuctionStatus.UNSOLD) faker.bool().bool() else true

            if (shouldHaveBids) {
                simulateBiddingWar(auction, allUsers)
            }
        }

        // 6. Final Status Check (Ensure SOLD has winner)
        if (status == AuctionStatus.SOLD && auction.winnerUser == null) {
            // Force a winner if random logic didn't produce one (e.g. reserve not met)
            auction.status = AuctionStatus.UNSOLD
            auctionRepository.save(auction)
        }
    }

    private fun simulateBiddingWar(auction: Auction, allUsers: List<User>) {
        // Filter out the seller so they don't bid on their own item
        val eligibleBidders = allUsers.filter { it.id != auction.item.seller.id }
        if (eligibleBidders.isEmpty()) return

        val bidCount = faker.number().numberBetween(3, 15)
        var currentPrice = auction.startPrice

        // Spread bids out over the auction duration
        val durationSeconds = ChronoUnit.SECONDS.between(auction.startTime,
            if(auction.endTime.isBefore(Instant.now())) auction.endTime else Instant.now()
        )
        val timeStep = if (bidCount > 0) durationSeconds / bidCount else 0

        val bids = mutableListOf<Bid>()

        for (i in 1..bidCount) {
            val bidder = eligibleBidders.random()

            // Increment
            val increment = BigDecimal(faker.number().numberBetween(100, 500))
            currentPrice = currentPrice.add(increment)

            val bidTime = auction.startTime.plusSeconds(timeStep * i)

            val bid = Bid(
                auction = auction,
                bidder = bidder,
                amount = currentPrice,
                bidTime = bidTime
            )
            bids.add(bid)
        }

        if (bids.isNotEmpty()) {
            // Bulk save bids
            val savedBids = bidRepository.saveAll(bids)

            // Update Auction with results of the war
            val winningBid = savedBids.last() // Last one is highest in this loop

            auction.currentPrice = winningBid.amount
            auction.bidCount = savedBids.size
            auction.winningBid = winningBid

            // Check if sold (Reserve met?)
            val reserve = auction.reservePrice
            if (reserve == null || winningBid.amount >= reserve) {
                if (auction.status != AuctionStatus.ACTIVE) {
                    auction.status = AuctionStatus.SOLD
                    auction.winnerUser = winningBid.bidder
                }
            } else if (auction.status != AuctionStatus.ACTIVE) {
                auction.status = AuctionStatus.UNSOLD
            }

            auctionRepository.save(auction)
        }
    }
}