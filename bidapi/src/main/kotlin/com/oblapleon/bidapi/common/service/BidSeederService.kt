package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import net.datafaker.Faker
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.util.concurrent.atomic.AtomicInteger

@Service
class BidSeederService(
    private val auctionRepository: AuctionRepository,
    private val userRepository: UserRepository,
    private val auctionService: AuctionService,
    private val rateLimitingService: RateLimitingService,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val faker = Faker()
    private val logger = LoggerFactory.getLogger(javaClass)

    fun seedLiveBidsParallel(totalBids: Int, concurrency: Int) {
        // 1. Target ALL ACTIVE auctions
        val activeAuctions = auctionRepository.findAll()
            .filter { it.status == AuctionStatus.ACTIVE }

        if (activeAuctions.isEmpty()) {
            logger.error("❌ No ACTIVE auctions found to attack.")
            return
        }

        val users = userRepository.findAll()
        if (users.size < 5) throw IllegalStateException("Not enough users to simulate a multi-auction war.")

        logger.info("🚀 Starting bidding attack on ${activeAuctions.size} active auctions with $totalBids total bids.")

        val successCount = AtomicInteger(0)
        val failCount = AtomicInteger(0)

        runBlocking {
            val semaphore = Semaphore(concurrency)

            val jobs = (1..totalBids).map {
                launch(Dispatchers.IO) {
                    // Random delay to smear the initial start of the attack
                    delay(faker.number().numberBetween(100L, 5000L))

                    semaphore.withPermit {
                        // Pick any active auction from the full list
                        val targetAuction = activeAuctions.random()
                        val bidder = users.filter { it.id != targetAuction.item.seller.id }.random()

                        var success = false
                        var attempt = 0
                        val maxRetries = 3

                        while (attempt < maxRetries && !success) {
                            attempt++

                            // Rate Limiting Check
                            val bucket = rateLimitingService.resolveBucket(bidder.id!!)
                            if (!bucket.tryConsume(1)) {
                                delay(1000) // Wait for bucket refill
                                continue
                            }

                            // Fetch fresh state to avoid stale price rejections
                            val currentAuction = auctionRepository.findById(targetAuction.id!!).orElse(null) ?: break

                            val increment = currentAuction.minBidIncrement.multiply(
                                BigDecimal.valueOf(faker.number().randomDouble(1, 1, 2))
                            )
                            val bidAmount = currentAuction.currentPrice.add(increment)

                            try {
                                auctionService.placeBid(currentAuction.id!!, bidder.id!!, bidAmount)
                                success = true
                                successCount.incrementAndGet()
                                logger.debug("⚡ Bid placed: ${bidder.username} -> ${currentAuction.item.make} ($bidAmount)")
                            } catch (e: Exception) {
                                // Short delay before retrying a failed bid due to race conditions
                                delay(faker.number().numberBetween(500L, 1500L))
                            }
                        }
                        if (!success) failCount.incrementAndGet()
                    }
                }
            }
            jobs.joinAll()
        }

        logger.info("""
            🏁 Global Auction Attack Complete:
            🎯 Auctions Targeted: ${activeAuctions.size}
            ✅ Total Successful Bids: ${successCount.get()}
            ❌ Total Failed Bids: ${failCount.get()}
        """.trimIndent())
    }
}