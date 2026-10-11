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
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner {
        return CommandLineRunner {
            if (itemRepository.count() > 0) {
                println("Data already seeded. Skipping...")
                return@CommandLineRunner
            }

            println("Seeding users, cars, and auctions...")

            val userRole = roleRepository.findByName(ERole.USER)
                ?: throw RuntimeException("Role USER not found")

            val seller1 = User(
                username = "seller_john",
                email = "john@example.com",
                password = passwordEncoder.encode("password123"),
                enabled = true
            ).apply { addRole(userRole) }

            val bidder1 = User(
                username = "bidder_alice",
                email = "alice@example.com",
                password = passwordEncoder.encode("password123"),
                enabled = true
            ).apply { addRole(userRole) }

            userRepository.saveAll(listOf(seller1, bidder1))

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

            for (i in 1..100) {
                val template = templates[i % templates.size]
                val isPending = Random.nextBoolean()
                val auctionStatus = if (isPending) AuctionStatus.PENDING_APPROVAL else AuctionStatus.ACTIVE
                val itemStatus = if (isPending) ItemStatus.PENDING_AUCTION else ItemStatus.ACTIVE_AUCTION
                
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
                
                for (j in 0 until 20) {
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
                
                val price = BigDecimal(Random.nextInt(15000, 95000).toString() + ".00")
                
                val auction = Auction(
                    item = item,
                    startPrice = price,
                    currentPrice = price,
                    isNoReserve = Random.nextBoolean(),
                    reservePrice = if (Random.nextBoolean()) price.add(BigDecimal("10000.00")) else null,
                    startTime = Instant.now().minus(if (isPending) -1 else Random.nextLong(1, 3), ChronoUnit.DAYS),
                    endTime = Instant.now().plus(Random.nextLong(1, 14), ChronoUnit.DAYS),
                    status = auctionStatus
                )
                auctionRepository.save(auction)
                
                item.auctionId = auction.id
                itemRepository.save(item)
            }

            println("100 cars seeded successfully.")
        }
    }
}
