package com.oblapleon.bidapi.common.seeder

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
import com.oblapleon.bidapi.feature.user.entity.Role
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.RoleRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlin.random.Random

@Component
@Profile("!prod")
class TestDataSeeder(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val itemRepository: ItemRepository,
    private val auctionRepository: AuctionRepository,
    private val passwordEncoder: PasswordEncoder
) : CommandLineRunner {

    private val logger = LoggerFactory.getLogger(TestDataSeeder::class.java)

    @Transactional
    override fun run(vararg args: String?) {
        if (auctionRepository.count() > 0) {
            logger.info("Database already seeded with auctions. Skipping TestDataSeeder.")
            return
        }

        logger.info("Seeding test data (100 active auctions)...")

        // 1. Create Roles if needed
        val userRole = roleRepository.findByName(ERole.USER) ?: roleRepository.save(Role(name = ERole.USER))

        // 2. Create Seller
        val seller = userRepository.findByUsername("test_seller").orElse(null) ?: userRepository.save(
            User(
                username = "test_seller",
                email = "test_seller@example.com",
                password = passwordEncoder.encode("password123")
            ).apply { roles = mutableSetOf(userRole) }
        )

        // Data banks for randomization
        val makesAndModels = mapOf(
            "Toyota" to listOf("Camry", "Corolla", "RAV4", "Supra"),
            "Honda" to listOf("Civic", "Accord", "CR-V", "S2000"),
            "Ford" to listOf("Mustang", "F-150", "Focus", "Explorer"),
            "Chevrolet" to listOf("Camaro", "Silverado", "Corvette", "Malibu"),
            "BMW" to listOf("M3", "M5", "X5", "328i"),
            "Audi" to listOf("A4", "S4", "R8", "Q5")
        )

        val colors = listOf("Black", "White", "Silver", "Red", "Blue", "Grey")
        val conditions = ConditionGrade.entries.toTypedArray()
        
        val auctionsToSave = mutableListOf<Auction>()

        for (i in 1..100) {
            val make = makesAndModels.keys.random()
            val model = makesAndModels[make]!!.random()
            val year = Random.nextInt(1990, 2024)
            val mileage = Random.nextInt(0, 150000)

            val item = Item(
                seller = seller,
                status = ItemStatus.ACTIVE_AUCTION,
                year = year,
                make = make,
                model = model,
                vin = "1HGCM82633A00" + String.format("%04d", i),
                location = "Test City, CA",
                mileage = mileage,
                description = "This is a seeded test vehicle: $year $make $model in great condition.",
                fuelType = listOf("Gasoline", "Electric", "Hybrid", "Diesel").random(),
                condition = conditions.random(),
                exteriorColor = colors.random(),
                interiorColor = colors.random(),
                transmission = listOf("Automatic", "Manual").random(),
                drivetrain = listOf("FWD", "RWD", "AWD", "4WD").random(),
                engine = "Test Engine",
                hasServiceHistory = Random.nextBoolean(),
                isNoReserve = Random.nextBoolean()
            )

            // Add a mock image
            item.addImage(
                ItemImage(
                    url = "https://ik.imagekit.io/yhtwz1q3j/default-car.jpg",
                    category = ImageCategory.MAIN,
                    sortOrder = 0,
                    item = item
                )
            )

            val startPrice = BigDecimal(Random.nextInt(1000, 50000))
            
            val auction = Auction(
                item = item,
                startPrice = startPrice,
                currentPrice = startPrice,
                reservePrice = if (item.isNoReserve) null else startPrice.multiply(BigDecimal("1.5")),
                isNoReserve = item.isNoReserve,
                minBidIncrement = BigDecimal("100.00"),
                startTime = Instant.now().minus(Random.nextLong(0, 24), ChronoUnit.HOURS),
                endTime = Instant.now().plus(Random.nextLong(1, 7), ChronoUnit.DAYS),
                status = AuctionStatus.ACTIVE
            )
            
            // Generate UUID manually so we can link them properly before save
            item.id = UUID.randomUUID()
            auction.id = UUID.randomUUID()
            
            item.auctionId = auction.id

            auctionsToSave.add(auction)
        }

        // We can just save the auctions. Since CascadeType might not cover Item depending on how it's mapped,
        // wait, Auction has ManyToOne to Item. Typically, you save Item first, then Auction.
        // Let's look at Auction.kt: @ManyToOne Item. It doesn't specify cascade. So we must save Items first.
        val itemsToSave = auctionsToSave.map { it.item }
        itemRepository.saveAll(itemsToSave)
        auctionRepository.saveAll(auctionsToSave)

        logger.info("Successfully seeded 100 active auctions.")
    }
}
