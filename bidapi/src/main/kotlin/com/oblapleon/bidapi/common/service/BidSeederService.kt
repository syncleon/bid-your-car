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
        val targetAuctions = auctionRepository.findAll()
            .filter { it.status == AuctionStatus.ACTIVE }
            .shuffled()
            .take(3)

        if (targetAuctions.isEmpty()) throw IllegalStateException("No ACTIVE auctions found.")

        val users = userRepository.findAll()
        if (users.size < 2) throw IllegalStateException("Not enough users to simulate bidding.")

        val successCount = AtomicInteger(0)
        val failCount = AtomicInteger(0)
        val retryCount = AtomicInteger(0)

        runBlocking {
            val semaphore = Semaphore(concurrency)

            val jobs = (1..totalBids).map {
                launch(Dispatchers.IO) {
                    // 🧍 HUMAN SIMULATION: The Initial Hesitation
                    // Distribute the start times randomly between 1 and 10 seconds.
                    // This smears the load so bids trickle in naturally instead of a massive spike.
                    delay(faker.number().numberBetween(1000L, 10000L))

                    semaphore.withPermit {
                        val targetAuction = targetAuctions.random()
                        val validBidders = users.filter { it.id != targetAuction.item.seller.id }

                        if (validBidders.isNotEmpty()) {
                            val bidder = validBidders.random()
                            var attempt = 0
                            var success = false
                            val maxRetries = 5 // Lowered retries since the time window is longer

                            while (attempt < maxRetries && !success) {
                                attempt++

                                // 🛡️ 1. API GATEWAY SIMULATION
                                val bucket = rateLimitingService.resolveBucket(bidder.id!!)
                                val probe = bucket.tryConsumeAndReturnRemaining(1)

                                if (!probe.isConsumed) {
                                    val waitTime = probe.nanosToWaitForRefill / 1_000_000_000
                                    logger.warn("🛑 [429 RATE LIMIT] ${bidder.username} blocked. Waiting ${waitTime}s.")

                                    try {
                                        messagingTemplate.convertAndSend("/topic/auctions/${targetAuction.id}", mapOf(
                                            "rateLimitEvent" to true,
                                            "bidderUsername" to bidder.username,
                                            "waitTime" to waitTime
                                        ))
                                    } catch (e: Exception) {}

                                    // Wait for bucket refill + human reaction
                                    delay((waitTime * 1000) + faker.number().numberBetween(500L, 1500L))
                                    continue
                                }

                                // 2. Read DB and calculate bid
                                val currentAuctionState = auctionRepository.findById(targetAuction.id!!).get()

                                // Make the bot bid a bit more realistically (1x to 2.5x the minimum increment)
                                val multiplier = faker.number().randomDouble(1, 1, 2)
                                val increment = currentAuctionState.minBidIncrement.multiply(BigDecimal.valueOf(multiplier))
                                val bidAmount = currentAuctionState.currentPrice.add(increment)

                                try {
                                    auctionService.placeBid(currentAuctionState.id!!, bidder.id!!, bidAmount)
                                    success = true
                                    successCount.incrementAndGet()

                                } catch (e: Exception) {
                                    val errorMsg = e.message ?: ""

                                    if (errorMsg.contains("too low", ignoreCase = true) ||
                                        errorMsg.contains("already the highest bidder", ignoreCase = true)) {

                                        logger.warn("🤺 Bidder ${bidder.username} rejected ($errorMsg). Retrying... (Attempt $attempt/$maxRetries)")
                                        retryCount.incrementAndGet()

                                        // 🧍 HUMAN SIMULATION: Reaction time to being outbid
                                        // It takes a human 2 to 5 seconds to realize they lost, type a new number, and click again.
                                        delay(faker.number().numberBetween(2000L, 5000L))
                                    } else {
                                        logger.error("❌ Bid failed permanently: $errorMsg")
                                        break
                                    }
                                }
                            }

                            if (!success) {
                                failCount.incrementAndGet()
                                logger.info("🏳️ Bidder ${bidder.username} gave up after $maxRetries attempts.")
                            }
                        }
                    }
                }
            }
            jobs.joinAll()
        }

        logger.info("""
            🏁 Realistic Bidding War Complete:
            ✅ Successful Bids: ${successCount.get()}
            🔄 Concurrency Retries Triggered: ${retryCount.get()}
            ❌ Failed/Gave Up: ${failCount.get()}
        """.trimIndent())
    }
}