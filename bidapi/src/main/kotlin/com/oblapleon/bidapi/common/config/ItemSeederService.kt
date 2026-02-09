package com.oblapleon.bidapi.common.config

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import com.oblapleon.bidapi.feature.item.repo.ItemRepo
import com.oblapleon.bidapi.feature.user.repo.UserRepo
import net.datafaker.Faker
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class ItemSeederService(
    private val itemRepo: ItemRepo,
    private val userRepo: UserRepo
) {
    private val faker = Faker()

    @Transactional
    fun seedItems(count: Int) {
        // Получаем список всех пользователей, чтобы назначать их продавцами
        val users = userRepo.findAll()
        if (users.isEmpty()) {
            throw IllegalStateException("No users found. Run UserInitializer first.")
        }

        val items = (1..count).map {
            val vehicle = faker.vehicle()
            val seller = users.random() // Случайный продавец

            var vin = vehicle.vin()
            if (itemRepo.existsByVin(vin)) {
                vin = UUID.randomUUID().toString().take(17).uppercase()
            }

            val item = Item(
                seller = seller,
                year = faker.number().numberBetween(2000, 2024),
                make = vehicle.make(),
                model = vehicle.model(),
                vin = vin,
                location = faker.address().city(),
                mileage = faker.number().numberBetween(5000, 250000),
                description = faker.lorem().paragraph(2),
                engine = "${faker.number().numberBetween(15, 50) / 10.0}L ${vehicle.engine()}",
                drivetrain = faker.options().option("FWD", "RWD", "AWD", "4WD"),
                transmission = faker.options().option("Automatic", "Manual", "CVT"),
                bodyStyle = vehicle.carType(),
                exteriorColor = faker.color().name(),
                interiorColor = faker.options().option("Black", "Beige", "Gray", "Red"),
                sellerType = faker.options().option("Private", "Dealer")
            )

            item.images.add(ItemImage(
                url = "https://assets.rimac-newsroom.com/1714143662-dsc05553-enhanced-nr.jpg?auto=format&fit=crop&ar=16%3A9&sharp=10&fp-x=0.45&fp-y=0.55&w=2200",
                item = item
            ))
            item.images.add(ItemImage(
                url = "https://image.cnbcfm.com/api/v1/image/107301321-1694761177851-IMG_5585.jpg?v=1694865542",
                item = item
            ))

            item.images.add(ItemImage(
                url = "https://assets.rimac-newsroom.com/1714143662-dsc05553-enhanced-nr.jpg?auto=format&fit=crop&ar=16%3A9&sharp=10&fp-x=0.45&fp-y=0.55&w=2200",
                item = item
            ))
            item.images.add(ItemImage(
                url = "https://image.cnbcfm.com/api/v1/image/107301321-1694761177851-IMG_5585.jpg?v=1694865542",
                item = item
            ))

            item.images.add(ItemImage(
                url = "https://assets.rimac-newsroom.com/1714143662-dsc05553-enhanced-nr.jpg?auto=format&fit=crop&ar=16%3A9&sharp=10&fp-x=0.45&fp-y=0.55&w=2200",
                item = item
            ))
            item.images.add(ItemImage(
                url = "https://image.cnbcfm.com/api/v1/image/107301321-1694761177851-IMG_5585.jpg?v=1694865542",
                item = item
            ))

            item
        }

        itemRepo.saveAll(items)
    }
}