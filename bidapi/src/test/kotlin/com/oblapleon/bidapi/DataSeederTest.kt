package com.oblapleon.bidapi

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.common.service.ItemSeederService
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.springframework.data.domain.PageRequest

@SpringBootTest
class DataSeederTest {

    @Autowired
    lateinit var itemSeederService: ItemSeederService

    @Autowired
    lateinit var itemRepository: ItemRepository

    @Autowired
    lateinit var auctionRepository: AuctionRepository

    @Test
    fun seedData() {
        // Create 100 new items
        itemSeederService.seedItems(100)

        // Fetch those items (DRAFT items)
        val page = itemRepository.findReadyForAuction(PageRequest.of(0, 100))
        val items = page.content

        val now = Instant.now()
        val auctions = items.map { item ->
            val startPrice = BigDecimal("15000.00")
            val auction = Auction(
                item = item,
                startPrice = startPrice,
                currentPrice = startPrice,
                minBidIncrement = BigDecimal("100.00"),
                reservePrice = null,
                startTime = now.minus(1, ChronoUnit.DAYS),
                endTime = now.plus(4, ChronoUnit.DAYS),
                status = AuctionStatus.ACTIVE,
                bidCount = 0
            )
            item.status = ItemStatus.ACTIVE_AUCTION
            itemRepository.save(item)
            auction
        }
        auctionRepository.saveAll(auctions)
    }
}
