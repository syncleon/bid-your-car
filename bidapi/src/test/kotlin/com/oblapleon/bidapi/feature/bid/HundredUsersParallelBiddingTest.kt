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
import java.util.concurrent.atomic.AtomicInteger

@SpringBootTest
@AutoConfigureMockMvc
class HundredUsersParallelBiddingTest {

    private val logger = LoggerFactory.getLogger(HundredUsersParallelBiddingTest::class.java)

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

    private fun resolveTargetAuction(): Auction {
        val configuredAuctionId = System.getProperty("auction.id") ?: System.getenv("AUCTION_ID")
        if (!configuredAuctionId.isNullOrBlank()) {
            val uuid = UUID.fromString(configuredAuctionId)
            val auction = auctionRepository.findById(uuid).orElse(null)
            if (auction != null) return auction
        }

        val activeAuction = auctionRepository.findAll().firstOrNull {
            it.status == AuctionStatus.ACTIVE && it.endTime.isAfter(Instant.now())
        }
        if (activeAuction != null) return activeAuction

        val seller = getOrCreateUser("seller_100_test", "seller100@example.com")
        val item = itemRepository.save(
            Item(
                seller = seller,
                status = ItemStatus.ACTIVE_AUCTION,
                year = 2024,
                make = "BMW",
                model = "M4 Competition",
                vin = "WBA100" + UUID.randomUUID().toString().substring(0, 10).uppercase(),
                location = "Austin, TX",
                mileage = 500,
                description = "Brand new M4 Competition track edition",
                fuelType = "Gasoline",
                horsepower = 503,
                condition = ConditionGrade.EXCELLENT
            )
        )

        val startPrice = BigDecimal("85000.00")
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

    private fun resolve100Bidders(sellerId: Long?): List<User> {
        val existing = userRepository.findAll().filter { it.enabled && it.id != sellerId }
        if (existing.size >= 100) {
            return existing.take(100)
        }

        val needed = 100 - existing.size
        logger.info("Seeding {} users to reach 100 parallel bidders...", needed)
        val userRole = roleRepository.findByName(ERole.USER) ?: roleRepository.save(Role(name = ERole.USER))
        val encodedPwd = passwordEncoder.encode("password123")
        val newUsers = (1..needed).map { i ->
            User(
                username = "hundred_user_$i",
                email = "hundred_$i@example.com",
                password = encodedPwd,
                enabled = true
            ).apply { addRole(userRole) }
        }
        val saved = userRepository.saveAll(newUsers)
        return (existing + saved).take(100)
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
    @DisplayName("Simulate 100 users submitting parallel quick bids simultaneously")
    fun test100UsersParallelQuickBidding() {
        val auction = resolveTargetAuction()
        val auctionId = auction.id!!
        val initialPrice = auction.currentPrice
        val initialBidCount = auction.bidCount

        val bidders = resolve100Bidders(auction.item.seller.id)
        assertEquals(100, bidders.size, "Must have exactly 100 bidders for the test")

        logger.info("=== STARTING 100 USERS PARALLEL QUICK BID TEST ===")
        logger.info("Target Auction: {} (Price: \${}, Bids: {})", auctionId, initialPrice, initialBidCount)

        val threadPool = Executors.newFixedThreadPool(50)
        val startGate = CountDownLatch(1)
        val completionGate = CountDownLatch(100)
        val acceptedCount = AtomicInteger(0)

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
                    logger.error("Error submitting bid for user ${user.username}", e)
                } finally {
                    completionGate.countDown()
                }
            }
        }

        val start = System.currentTimeMillis()
        startGate.countDown()
        val finishedInTime = completionGate.await(15, TimeUnit.SECONDS)
        val elapsedMs = System.currentTimeMillis() - start
        threadPool.shutdown()

        assertTrue(finishedInTime, "All 100 requests should complete within 15 seconds")
        assertEquals(100, acceptedCount.get(), "All 100 parallel requests must return HTTP 202 Accepted")
        logger.info("100 parallel quick bids accepted in {}ms (throughput: {} req/s)",
            elapsedMs, Math.round((100.0 / elapsedMs) * 1000))

        // Drain the batch queue
        bidQueueProcessor.processBids()
        Thread.sleep(1500)

        val updatedAuction = auctionRepository.findById(auctionId).orElseThrow()
        logger.info("Updated Auction: Price=\${} (+\${}), Bids={} (+{}), Winner={}",
            updatedAuction.currentPrice,
            updatedAuction.currentPrice - initialPrice,
            updatedAuction.bidCount,
            updatedAuction.bidCount - initialBidCount,
            updatedAuction.winningBid?.bidder?.username)

        assertTrue(updatedAuction.currentPrice > initialPrice, "Price should increase")
        assertTrue(updatedAuction.bidCount >= initialBidCount + 100, "Bid count should increase by 100")
        assertNotNull(updatedAuction.winningBid, "Must have an assigned winner")
        assertTrue(bidders.any { it.id == updatedAuction.winningBid?.bidder?.id }, "Winner must be one of the 100 bidders")
    }

    @Test
    @DisplayName("Simulate 100 users submitting parallel escalating custom bids")
    fun test100UsersParallelCustomBidding() {
        val auction = resolveTargetAuction()
        val auctionId = auction.id!!
        val currentPrice = auction.currentPrice
        val increment = BidIncrementUtil.getDynamicBidIncrement(currentPrice)

        val bidders = resolve100Bidders(auction.item.seller.id)
        assertEquals(100, bidders.size)

        logger.info("=== STARTING 100 USERS PARALLEL CUSTOM BID TEST ===")
        logger.info("Current Price: \${}, Increment: \${}", currentPrice, increment)

        val threadPool = Executors.newFixedThreadPool(50)
        val startGate = CountDownLatch(1)
        val completionGate = CountDownLatch(100)
        val acceptedCount = AtomicInteger(0)

        for ((index, user) in bidders.withIndex()) {
            val customAmount = currentPrice.add(increment.multiply(BigDecimal(index + 1)))
            threadPool.submit {
                try {
                    val token = jwtTokenProvider.createToken(user)
                    startGate.await()

                    val req = BidRequest(amount = customAmount)
                    val result = mockMvc.perform(
                        post("/api/v1/auctions/$auctionId/bids")
                            .header("Authorization", "Bearer $token")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
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

        val start = System.currentTimeMillis()
        startGate.countDown()
        val allDone = completionGate.await(15, TimeUnit.SECONDS)
        val durationMs = System.currentTimeMillis() - start
        threadPool.shutdown()

        assertTrue(allDone)
        assertEquals(100, acceptedCount.get())
        logger.info("100 custom bids accepted in {}ms", durationMs)

        // Drain queue
        bidQueueProcessor.processBids()
        Thread.sleep(1500)

        val finalAuction = auctionRepository.findById(auctionId).orElseThrow()
        logger.info("Final Auction State: Price=\${}, Bids={}, Winner={}",
            finalAuction.currentPrice, finalAuction.bidCount, finalAuction.winningBid?.bidder?.username)

        assertTrue(finalAuction.currentPrice > currentPrice)
        // Bidder #100 had the highest bid amount
        val topBidder = bidders.last()
        assertEquals(topBidder.id, finalAuction.winningBid?.bidder?.id, "Top bidder must win the escalating custom round")
    }
}
