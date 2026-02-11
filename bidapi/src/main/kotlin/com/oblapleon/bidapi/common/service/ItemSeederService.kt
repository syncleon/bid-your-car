package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import net.datafaker.Faker
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class ItemSeederService(
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository
) {
    private val faker = Faker()

    @Transactional
    fun seedItems(count: Int) {
        val users = userRepository.findAll()
        if (users.isEmpty()) {
            throw IllegalStateException("No users found. Please seed users first.")
        }

        val items = (1..count).map {
            val seller = users.random()

            // Generate valid-looking Vehicle data
            val make = faker.vehicle().make()
            val model = faker.vehicle().model(make)

            // Ensure Unique VIN
            var vin = faker.vehicle().vin()
            if (itemRepository.existsByVin(vin)) {
                vin = UUID.randomUUID().toString().replace("-", "").take(17).uppercase()
            }

            val item = Item(
                seller = seller,
                status = ItemStatus.AVAILABLE, // Ready for auction
                year = faker.number().numberBetween(1960, 2024),
                make = make,
                model = model,
                vin = vin,
                location = faker.address().city(),
                mileage = faker.number().numberBetween(0, 250000),
                description = faker.lorem().paragraph(3),
                engine = "${faker.number().numberBetween(20, 60) / 10.0}L ${faker.vehicle().engine()}",
                drivetrain = faker.options().option("RWD", "AWD", "FWD", "4WD"),
                transmission = faker.options().option("Automatic", "Manual", "Dual-Clutch"),
                bodyStyle = faker.options().option("Coupe", "Sedan", "SUV", "Convertible"),
                exteriorColor = faker.color().name().replaceFirstChar { it.uppercase() },
                interiorColor = faker.options().option("Black", "Tan", "Red", "Gray"),
                sellerType = if (faker.bool().bool()) "Private" else "Dealer"
            )

            // Add Images (addImage helper automatically sets the first one as thumbnail)
            val imageUrls = listOf(
                "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1000&q=80"
            )

            // Add 3 to 5 random images
            val selectedImages = imageUrls.shuffled().take(faker.number().numberBetween(3, 5))

            selectedImages.forEachIndexed { index, url ->
                val image = ItemImage(
                    url = url,
                    item = item,
                    sortOrder = index
                )
                item.addImage(image)
            }

            item
        }

        itemRepository.saveAll(items)
    }
}