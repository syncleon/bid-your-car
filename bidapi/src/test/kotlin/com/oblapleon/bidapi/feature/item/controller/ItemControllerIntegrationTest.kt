package com.oblapleon.bidapi.feature.item.controller

import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
class ItemControllerIntegrationTest {
    @Autowired
    lateinit var itemRepository: ItemRepository

    @Test
    @Transactional
    fun checkAuctionId() {
        val items = itemRepository.findAll()
        items.forEach {
            println("Item: ${it.id}, Status: ${it.status}, AuctionId: ${it.auctionId}")
        }
    }
}
