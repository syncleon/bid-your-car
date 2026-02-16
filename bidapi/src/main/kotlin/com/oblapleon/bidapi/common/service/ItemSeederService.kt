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

    // Fixed missing commas and simplified to return all images shuffled
    private fun generateCarImages(): List<String> {
        val fallbackImages = listOf(
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
            "https://cdn.pixabay.com/photo/2017/03/05/15/29/aston-martin-2118857_1280.jpg",
            "https://cdn.pixabay.com/photo/2012/11/02/13/02/car-63930_1280.jpg"
        )

        return fallbackImages.shuffled()
    }

    @Transactional
    fun seedItems(count: Int) {
        val users = userRepository.findAll()
        if (users.isEmpty()) {
            throw IllegalStateException("No users found. Please seed users first.")
        }

        val items = (1..count).map {
            val seller = users.random()
            val make = faker.vehicle().make()
            val model = faker.vehicle().model(make)

            var vin = faker.vehicle().vin()
            if (itemRepository.existsByVin(vin)) {
                vin = UUID.randomUUID().toString().replace("-", "").take(17).uppercase()
            }

            val item = Item(
                seller = seller,
                status = ItemStatus.DRAFT,
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

            // Get all images shuffled and attach them to the item
            generateCarImages().forEachIndexed { index, url ->
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