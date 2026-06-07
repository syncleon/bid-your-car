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

    private fun generateCarImages(): List<String> {
        val fallbackImages = (1..10).map { "/images/cars/car$it.png" }

        return fallbackImages.shuffled().take(10) // Returns 10 random images per car
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