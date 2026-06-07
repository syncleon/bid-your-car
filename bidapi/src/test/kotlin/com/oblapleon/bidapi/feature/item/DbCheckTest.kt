package com.oblapleon.bidapi.feature.item

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate

@SpringBootTest
class DbCheckTest {
    @Autowired
    lateinit var jdbcTemplate: JdbcTemplate

    @Test
    fun checkAuctionsAndItems() {
        println("=== DB CHECK START ===")
        val items = jdbcTemplate.queryForList("SELECT id, status, auction_id FROM items WHERE status = 'PENDING_AUCTION'")
        println("Items with PENDING_AUCTION: \$items")
        
        val auctions = jdbcTemplate.queryForList("SELECT id, item_id, status FROM auctions")
        println("Auctions: \$auctions")
        println("=== DB CHECK END ===")
    }
}
