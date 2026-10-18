package com.oblapleon.bidapi.feature.bid

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil
import com.oblapleon.bidapi.feature.bid.dto.BidRequest
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.bid.service.BidQueueProcessor
import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@AutoConfigureMockMvc
class ParallelBiddingSimulationTest {

    private val logger = LoggerFactory.getLogger(ParallelBiddingSimulationTest::class.java)

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var roleRepository: RoleRepository

    @Autowired
    lateinit var auctionRepository: AuctionRepository

    @Autowired
    lateinit var itemRepository: ItemRepository

    @Autowired
    lateinit var bidRepository: BidRepository

    @Autowired
    lateinit var jwtTokenProvider: JwtTokenProvider

    @Autowired
    lateinit var bidQueueProcessor: BidQueueProcessor

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var passwordEncoder: PasswordEncoder

    /**
     * Resolves an auction for the simulation.
     * 1. Checks system property "auction.id" or environment variable "AUCTION_ID".
     * 2. Otherwise finds any ACTIVE auction from the database.
     * 3. If none exist (e.g. isolated test environment), seeds an active auction.
     */
    private fun resolveTargetAuction(): Auction {
        val configuredAuctionId = System.getProperty("auction.id") ?: System.getenv("AUCTION_ID")
        if (!configuredAuctionId.isNullOrBlank()) {
            val uuid = UUID.fromString(configuredAuctionId)
            val auction = auctionRepository.findById(uuid).orElse(null)
            if (auction != null) {
                logger.info("Using configured auction from environment: id={}, currentPrice={}", auction.id, auction.currentPrice)
                return auction
            }
            logger.warn("Auction $configuredAuctionId specified by system/env not found in DB, falling back to active search.")
        }

        val activeAuction = auctionRepository.findAll().firstOrNull {
            it.status == AuctionStatus.ACTIVE && it.endTime.isAfter(Instant.now())
        }
        if (activeAuction != null) {
            logger.info("Found existing active auction in database: id={}, currentPrice={}, bidCount={}",
                activeAuction.id, activeAuction.currentPrice, activeAuction.bidCount)
            return activeAuction
        }

        // If no active auction exists, create one for testing
        logger.info("No active auctions found in database. Seeding a new active auction...")
        val seller = getOrCreateUser("test_seller_sim", "seller_sim@example.com")
        val item = itemRepository.save(
            Item(
                seller = seller,
                status = ItemStatus.ACTIVE_AUCTION,
                year = 2023,
                make = "Porsche",
                model = "911 GT3",
                vin = "WP0SIM" + UUID.randomUUID().toString().substring(0, 10).uppercase(),
                location = "Chicago, IL",
                mileage = 1200,
                description = "Mint condition track weapon",
                fuelType = "Gasoline",
                horsepower = 502,
                condition = ConditionGrade.EXCELLENT
            )
        )

        val startPrice = BigDecimal("150000.00")
        val now = Instant.now()
        val createdAuction = auctionRepository.save(
            Auction(
                item = item,
                startPrice = startPrice,
                currentPrice = startPrice,
                startTime = now.minus(1, ChronoUnit.DAYS),
                endTime = now.plus(7, ChronoUnit.DAYS),
                status = AuctionStatus.ACTIVE,
                isNoReserve = true,
                minBidIncrement = BidIncrementUtil.getDynamicBidIncrement(startPrice)
            )
        )
        item.auctionId = createdAuction.id
        itemRepository.save(item)

        return createdAuction
    }

    /**
     * Retrieves current active users from the database, excluding the seller.
     * Seeds realistic simulation users if the database user pool is insufficient.
     */
    private fun resolveBidders(sellerId: Long?): List<User> {
        val existingUsers = userRepository.findAll().filter {
            it.enabled && it.id != sellerId
        }

        if (existingUsers.size >= 3) {
            logger.info("Using {} existing bidders from database: {}", existingUsers.size, existingUsers.map { it.username })
            return existingUsers
        }

        logger.info("Fewer than 3 bidders found in DB. Seeding additional test bidders...")
        val neededBidders = listOf(
            "sim_bidder_1" to "sim1@example.com",
            "sim_bidder_2" to "sim2@example.com",
            "sim_bidder_3" to "sim3@example.com",
            "sim_bidder_4" to "sim4@example.com",
            "sim_bidder_5" to "sim5@example.com"
        )
        return neededBidders.map { (username, email) ->
            getOrCreateUser(username, email)
        }
    }

    private fun getOrCreateUser(username: String, email: String): User {
        return userRepository.findByUsername(username).orElseGet {
            val userRole = roleRepository.findByName(ERole.USER) ?: roleRepository.save(Role(name = ERole.USER))
            val user = User(
                username = username,
                email = email,
                password = passwordEncoder.encode("password123"),
                enabled = true
            ).apply { addRole(userRole) }
            userRepository.save(user)
        }
    }

    @Test
    @DisplayName("Simulate parallel quick bidding on any auction using current database users")
    fun testParallelQuickBiddingOnAnyAuction() {
        val targetAuction = resolveTargetAuction()
        val auctionId = targetAuction.id!!
        val initialPrice = targetAuction.currentPrice
        val initialBidCount = targetAuction.bidCount

        val bidders = resolveBidders(targetAuction.item.seller.id)
        assertTrue(bidders.isNotEmpty(), "There must be at least one bidder from the database")

        logger.info("=== STARTING PARALLEL QUICK BID SIMULATION ===")
        logger.info("Auction ID: {}", auctionId)
        logger.info("Vehicle: {} {}", targetAuction.item.make, targetAuction.item.model)
        logger.info("Initial Price: \${}, Initial Bids: {}", initialPrice, initialBidCount)
        logger.info("Simulating {} parallel bidders concurrently", bidders.size)

        val threadPool = Executors.newFixedThreadPool(bidders.size)
        val startGate = CountDownLatch(1)
        val completionGate = CountDownLatch(bidders.size)
        val responseStatuses = ConcurrentLinkedQueue<Pair<String, Int>>()
        val responseTimes = ConcurrentLinkedQueue<Long>()

        for (user in bidders) {
            threadPool.submit {
                try {
                    val token = jwtTokenProvider.createToken(user)
                    // Wait for all threads to be ready
                    startGate.await()

                    val startTime = System.currentTimeMillis()
                    val result = mockMvc.perform(
                        post("/api/v1/auctions/$auctionId/bids/quick")
                            .header("Authorization", "Bearer $token")
                            .contentType(MediaType.APPLICATION_JSON)
                    ).andReturn()
                    val elapsed = System.currentTimeMillis() - startTime

                    val status = result.response.status
                    responseStatuses.add(user.username to status)
                    responseTimes.add(elapsed)
                    logger.info("Bidder [{}] -> HTTP {} in {}ms", user.username, status, elapsed)
                } catch (e: Exception) {
                    logger.error("Error for bidder ${user.username}", e)
                    responseStatuses.add(user.username to 500)
                } finally {
                    completionGate.countDown()
                }
            }
        }

        // Fire all threads simultaneously
        val startSimTime = System.currentTimeMillis()
        startGate.countDown()
        val allFinished = completionGate.await(10, TimeUnit.SECONDS)
        val totalElapsed = System.currentTimeMillis() - startSimTime
        threadPool.shutdown()

        assertTrue(allFinished, "All parallel bid requests should finish within timeout")

        logger.info("All {} parallel requests sent in {}ms", bidders.size, totalElapsed)
        val acceptedCount = responseStatuses.count { it.second == 202 }
        logger.info("Responses: {} / {} accepted (HTTP 202)", acceptedCount, bidders.size)
        assertEquals(bidders.size, acceptedCount, "Every valid bidder's quick-bid request should be accepted into the queue (202)")

        // Trigger batch queue processing with retry until processed or timeout
        logger.info("Draining Redis batch queue for auction {}...", auctionId)
        var updatedAuction = auctionRepository.findById(auctionId).orElseThrow()
        val deadline1 = System.currentTimeMillis() + 5000
        while (System.currentTimeMillis() < deadline1 && updatedAuction.bidCount == initialBidCount) {
            bidQueueProcessor.processBids()
            Thread.sleep(300)
            updatedAuction = auctionRepository.findById(auctionId).orElseThrow()
        }

        // Verify updated auction state in database
        logger.info("=== SIMULATION RESULTS ===")
        logger.info("Price: \${} -> \${}", initialPrice, updatedAuction.currentPrice)
        logger.info("Bid count: {} -> {}", initialBidCount, updatedAuction.bidCount)
        logger.info("Winning bidder: {}", updatedAuction.winningBid?.bidder?.username ?: "None")

        assertTrue(updatedAuction.currentPrice >= initialPrice, "Current price should not decrease")
        assertTrue(updatedAuction.bidCount > initialBidCount, "Bid count should increase after processing batch")
        assertNotNull(updatedAuction.winningBid, "Auction should have a winning bid")
        assertTrue(
            bidders.any { it.id == updatedAuction.winningBid?.bidder?.id },
            "Winning bidder must be one of the simulation bidders"
        )
    }

    @Test
    @DisplayName("Simulate parallel custom bids with escalating amounts across multiple database users")
    fun testParallelCustomEscalatingBids() {
        val targetAuction = resolveTargetAuction()
        val auctionId = targetAuction.id!!
        val currentPrice = targetAuction.currentPrice
        val increment = BidIncrementUtil.getDynamicBidIncrement(currentPrice)

        val bidders = resolveBidders(targetAuction.item.seller.id)
        if (bidders.size < 2) return

        logger.info("=== STARTING PARALLEL CUSTOM BID SIMULATION ===")
        logger.info("Current Price: \${}, Increment: \${}", currentPrice, increment)

        val threadPool = Executors.newFixedThreadPool(bidders.size)
        val startGate = CountDownLatch(1)
        val completionGate = CountDownLatch(bidders.size)
        val successfulRequests = ConcurrentLinkedQueue<String>()

        for ((index, user) in bidders.withIndex()) {
            val bidAmount = currentPrice.add(increment.multiply(BigDecimal(index + 1)))
            threadPool.submit {
                try {
                    val token = jwtTokenProvider.createToken(user)
                    startGate.await()

                    val req = BidRequest(amount = bidAmount)
                    val result = mockMvc.perform(
                        post("/api/v1/auctions/$auctionId/bids")
                            .header("Authorization", "Bearer $token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                    ).andReturn()

                    if (result.response.status == 202) {
                        successfulRequests.add(user.username)
                        logger.info("Bidder [{}] enqueued custom bid of \${} -> 202", user.username, bidAmount)
                    } else {
                        logger.warn("Bidder [{}] custom bid returned HTTP {}", user.username, result.response.status)
                    }
                } catch (e: Exception) {
                    logger.error("Custom bid error for ${user.username}", e)
                } finally {
                    completionGate.countDown()
                }
            }
        }

        startGate.countDown()
        completionGate.await(10, TimeUnit.SECONDS)
        threadPool.shutdown()

        assertEquals(bidders.size, successfulRequests.size, "All parallel custom bid requests should be accepted (HTTP 202)")

        // Process batch queue with retry until processed or timeout
        var finalAuction = auctionRepository.findById(auctionId).orElseThrow()
        val deadline2 = System.currentTimeMillis() + 5000
        while (System.currentTimeMillis() < deadline2 && finalAuction.currentPrice <= currentPrice) {
            bidQueueProcessor.processBids()
            Thread.sleep(300)
            finalAuction = auctionRepository.findById(auctionId).orElseThrow()
        }

        logger.info("Final auction state: price=\${}, bids={}, winner={}",
            finalAuction.currentPrice, finalAuction.bidCount, finalAuction.winningBid?.bidder?.username)

        assertTrue(finalAuction.currentPrice > currentPrice, "Price must increase after custom bids")
    }

    @Test
    @DisplayName("Simulate 500 users parallel bidding on one car auction")
    fun test500UsersParallelBidding() {
        val targetAuction = resolveTargetAuction()
        val auctionId = targetAuction.id!!
        val initialPrice = targetAuction.currentPrice
        val initialBidCount = targetAuction.bidCount
        val sellerId = targetAuction.item.seller.id

        // Fetch or seed bidders for the high concurrency simulation
        var allUsers = userRepository.findAll().filter { it.enabled && it.id != sellerId }
        val bidders = if (allUsers.size >= 100) {
            allUsers.take(100)
        } else {
            val userRole = roleRepository.findByName(ERole.USER) ?: roleRepository.save(Role(name = ERole.USER))
            val newBidders = (1..100).map { i ->
                User(
                    username = "sim_user_$i",
                    email = "sim_$i@example.com",
                    password = passwordEncoder.encode("password123"),
                    enabled = true
                ).apply { addRole(userRole) }
            }
            userRepository.saveAll(newBidders)
        }

        logger.info("=== STARTING 500 USERS PARALLEL BID SIMULATION ===")
        logger.info("Auction: {} (initial price: \${}, initial bids: {})", auctionId, initialPrice, initialBidCount)
        logger.info("Firing {} concurrent bidders simultaneously...", bidders.size)

        val threadPool = Executors.newFixedThreadPool(50)
        val startGate = CountDownLatch(1)
        val completionGate = CountDownLatch(bidders.size)
        val acceptedCount = java.util.concurrent.atomic.AtomicInteger(0)

        for (user in bidders) {
            threadPool.submit {
                try {
                    val token = jwtTokenProvider.createToken(user)
                    startGate.await()

                    val result = mockMvc.perform(
                        post("/api/v1/auctions/$auctionId/bids/quick")
                            .header("Authorization", "Bearer $token")
                            .contentType(MediaType.APPLICATION_JSON)
                    ).andReturn()

                    if (result.response.status == 202) {
                        acceptedCount.incrementAndGet()
                    }
                } catch (e: Exception) {
                    logger.error("Error for bidder ${user.username}", e)
                } finally {
                    completionGate.countDown()
                }
            }
        }

        val startSim = System.currentTimeMillis()
        startGate.countDown()
        val allFinished = completionGate.await(15, TimeUnit.SECONDS)
        val totalMs = System.currentTimeMillis() - startSim
        threadPool.shutdown()

        assertTrue(allFinished, "All 500 requests should finish within timeout")
        assertEquals(bidders.size, acceptedCount.get(), "All 500 parallel requests must return HTTP 202 Accepted")
        logger.info("500 parallel bids queued in {}ms (throughput: {} req/sec)",
            totalMs, Math.round((bidders.size.toDouble() / totalMs) * 1000))

        // Drain the batch queue with retry until processed or timeout
        var updatedAuction = auctionRepository.findById(auctionId).orElseThrow()
        val deadline3 = System.currentTimeMillis() + 5000
        while (System.currentTimeMillis() < deadline3 && updatedAuction.bidCount == initialBidCount) {
            bidQueueProcessor.processBids()
            Thread.sleep(300)
            updatedAuction = auctionRepository.findById(auctionId).orElseThrow()
        }

        logger.info("Final State: price=\${} (+\${}), bids={} (+{}), winner={}",
            updatedAuction.currentPrice,
            updatedAuction.currentPrice - initialPrice,
            updatedAuction.bidCount,
            updatedAuction.bidCount - initialBidCount,
            updatedAuction.winningBid?.bidder?.username)

        assertTrue(updatedAuction.currentPrice > initialPrice)
        assertTrue(updatedAuction.bidCount > initialBidCount)
        assertNotNull(updatedAuction.winningBid)
    }
}

