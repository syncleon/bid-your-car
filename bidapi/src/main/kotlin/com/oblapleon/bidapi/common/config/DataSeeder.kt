package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlin.random.Random

@Configuration
class DataSeeder {

    @Bean
    @Transactional
    fun initData(
        userRepository: UserRepository,
        roleRepository: RoleRepository,
        itemRepository: ItemRepository,
        auctionRepository: AuctionRepository,
        bidRepository: com.oblapleon.bidapi.feature.bid.repository.BidRepository,
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner {
        return CommandLineRunner {
            val userRole = roleRepository.findByName(ERole.USER)
                ?: throw RuntimeException("Role USER not found")

            val existingUsers = userRepository.findAll().associateBy { it.username }

            val seller1 = existingUsers["seller_john"] ?: User(
                username = "seller_john",
                email = "john@example.com",
                password = passwordEncoder.encode("password123"),
                enabled = true
            ).apply { addRole(userRole); userRepository.save(this) }

            val bidderNames = listOf(
                "bidder_alice" to "alice@example.com",
                "apex_hunter" to "apex@example.com",
                "turbo_collector" to "turbo@example.com",
                "miami_gtr" to "gtr@example.com",
                "bimmer_enthusiast" to "bimmer@example.com",
                "trackday_pro" to "track@example.com",
                "vintage_v8" to "v8@example.com"
            )

            val bidders = bidderNames.map { (uname, email) ->
                existingUsers[uname] ?: User(
                    username = uname,
                    email = email,
                    password = passwordEncoder.encode("password123"),
                    enabled = true
                ).apply { addRole(userRole); userRepository.save(this) }
            }

            if (itemRepository.count() == 0L) {
                println("Seeding users, cars, and auctions...")

                data class CarTemplate(val make: String, val model: String, val engine: String, val imgUrl: String)

                val templates = listOf(
                    CarTemplate("Porsche", "911 Carrera", "3.0L Flat-6", "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("BMW", "M3", "3.0L Inline-6", "https://images.unsplash.com/photo-1508974239320-0a029497e820?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Ford", "Mustang GT", "5.0L V8", "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Chevrolet", "Corvette", "6.2L V8", "https://images.unsplash.com/photo-1553440569-bcc63803a83d?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Audi", "R8", "5.2L V10", "https://images.unsplash.com/photo-1555215695-3004980ad54e?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Mercedes-Benz", "AMG GT", "4.0L V8", "https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Toyota", "Supra", "3.0L Inline-6", "https://images.unsplash.com/photo-1592853625511-ad0edcc69c07?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Nissan", "GT-R", "3.8L V6", "https://images.unsplash.com/photo-1592853625597-7d17be820d0c?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Honda", "Civic Type R", "2.0L I4", "https://images.unsplash.com/photo-1592853625601-bb9d23da12fc?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                    CarTemplate("Subaru", "WRX STI", "2.5L Flat-4", "https://images.unsplash.com/photo-1609386464913-4cbfa39de540?fm=jpg&q=60&w=3000&auto=format&fit=crop"),
                )
                val colors = listOf("Black", "White", "Silver", "Red", "Blue", "Grey", "Yellow", "Orange", "Green")
                val transmissions = listOf("Automatic", "Manual", "Dual-Clutch")

                for (i in 1..60) {
                    val template = templates[i % templates.size]
                    val isSold = i <= 15
                    val isPending = !isSold && i > 55
                    val auctionStatus = when {
                        isSold -> AuctionStatus.SOLD
                        isPending -> AuctionStatus.PENDING_APPROVAL
                        else -> AuctionStatus.ACTIVE
                    }
                    val itemStatus = when {
                        isSold -> ItemStatus.SOLD
                        isPending -> ItemStatus.PENDING_AUCTION
                        else -> ItemStatus.ACTIVE_AUCTION
                    }

                    val item = Item(
                        year = Random.nextInt(2010, 2024),
                        make = template.make,
                        model = template.model,
                        vin = "VIN" + UUID.randomUUID().toString().substring(0, 14).uppercase(),
                        location = listOf("Los Angeles, CA", "Austin, TX", "Denver, CO", "Miami, FL", "New York, NY", "Seattle, WA").random(),
                        mileage = Random.nextInt(1000, 100000),
                        description = "A fine example of a ${template.make} ${template.model}.",
                        fuelType = "Gasoline",
                        horsepower = Random.nextInt(250, 650),
                        condition = ConditionGrade.values().random(),
                        hasServiceHistory = Random.nextBoolean(),
                        engine = template.engine,
                        transmission = transmissions.random(),
                        exteriorColor = colors.random(),
                        interiorColor = colors.random(),
                        seller = seller1,
                        status = itemStatus
                    )

                    for (j in 0 until 12) {
                        item.addImage(
                            ItemImage(
                                url = "${template.imgUrl}&idx=$i-$j",
                                category = if (j == 0) ImageCategory.MAIN else ImageCategory.OTHER,
                                sortOrder = j,
                                item = item
                            )
                        )
                    }
                    itemRepository.save(item)

                    val startPriceNum = (Random.nextInt(15, 80) * 1000).toBigDecimal().setScale(2)
                    val isNoReserve = Random.nextBoolean()
                    val reservePriceNum = if (isNoReserve) null else startPriceNum.add(BigDecimal("10000.00"))

                    val startTime = if (isSold) {
                        Instant.now().minus(8, ChronoUnit.DAYS)
                    } else if (isPending) {
                        Instant.now().plus(1, ChronoUnit.DAYS)
                    } else {
                        Instant.now().minus(Random.nextLong(1, 5), ChronoUnit.DAYS)
                    }

                    val endTime = if (isSold) {
                        Instant.now().minus(Random.nextLong(1, 48), ChronoUnit.HOURS)
                    } else if (isPending) {
                        startTime.plus(7, ChronoUnit.DAYS)
                    } else {
                        // Some active ending in a few hours, others in days
                        if (i % 5 == 0) Instant.now().plus(Random.nextLong(15, 360), ChronoUnit.MINUTES)
                        else Instant.now().plus(Random.nextLong(1, 6), ChronoUnit.DAYS)
                    }

                    val auction = Auction(
                        item = item,
                        startPrice = startPriceNum,
                        currentPrice = startPriceNum,
                        isNoReserve = isNoReserve,
                        reservePrice = reservePriceNum,
                        startTime = startTime,
                        endTime = endTime,
                        status = auctionStatus
                    )
                    auctionRepository.save(auction)

                    item.auctionId = auction.id
                    itemRepository.save(item)
                }

                println("Cars and auctions created.")
            }

            // Seed realistic bids for active and sold auctions that have 0 bids
            if (bidRepository.count() == 0L) {
                println("Seeding realistic Cars & Bids bid progressions...")
                val auctionsToBid = auctionRepository.findAll().filter {
                    it.status == AuctionStatus.ACTIVE || it.status == AuctionStatus.SOLD
                }

                for (auction in auctionsToBid) {
                    val bidStepsCount = if (auction.status == AuctionStatus.SOLD) Random.nextInt(5, 12) else Random.nextInt(2, 9)
                    var runningPrice = auction.startPrice
                    var lastBidderIndex = -1
                    val auctionBids = mutableListOf<com.oblapleon.bidapi.feature.bid.entity.Bid>()
                    val auctionDurationSecs = ChronoUnit.SECONDS.between(auction.startTime, if (auction.status == AuctionStatus.SOLD) auction.endTime else Instant.now())
                    val timeStep = if (auctionDurationSecs > 0) auctionDurationSecs / (bidStepsCount + 1) else 3600L

                    for (step in 1..bidStepsCount) {
                        var nextBidderIndex = Random.nextInt(bidders.size)
                        while (nextBidderIndex == lastBidderIndex && bidders.size > 1) {
                            nextBidderIndex = Random.nextInt(bidders.size)
                        }
                        lastBidderIndex = nextBidderIndex
                        val bidder = bidders[nextBidderIndex]

                        val increment = com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil.getDynamicBidIncrement(runningPrice)
                        // In Cars & Bids, bidders either bid exact increment or jump up nicely (e.g. +$250, +$500, +$1,000, +$2,500)
                        val multiplier = if (Random.nextInt(4) == 0) Random.nextInt(2, 5) else 1
                        val nextAmount = runningPrice.add(increment.multiply(BigDecimal(multiplier)))

                        val bidTime = auction.startTime.plusSeconds(step * timeStep).coerceAtMost(if (auction.status == AuctionStatus.SOLD) auction.endTime.minusSeconds(10) else Instant.now())

                        val bid = com.oblapleon.bidapi.feature.bid.entity.Bid(
                            auction = auction,
                            bidder = bidder,
                            amount = nextAmount,
                            maxAmount = nextAmount,
                            bidTime = bidTime
                        )
                        auctionBids.add(bid)
                        runningPrice = nextAmount
                    }

                    if (auctionBids.isNotEmpty()) {
                        val savedBids = bidRepository.saveAll(auctionBids)
                        val lastBid = savedBids.last()
                        auction.currentPrice = lastBid.amount
                        auction.bidCount = savedBids.size
                        auction.winningBid = lastBid
                        auction.minBidIncrement = com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil.getDynamicBidIncrement(lastBid.amount)

                        if (auction.status == AuctionStatus.SOLD) {
                            auction.winnerUser = lastBid.bidder
                            // Ensure reserve met for sold auctions
                            if (!auction.isNoReserve && auction.reservePrice != null && auction.currentPrice < auction.reservePrice!!) {
                                auction.reservePrice = auction.currentPrice
                            }
                        }
                        auctionRepository.save(auction)
                    }
                }
                println("Realistic bids seeded successfully!")
            }
        }
    }
}
