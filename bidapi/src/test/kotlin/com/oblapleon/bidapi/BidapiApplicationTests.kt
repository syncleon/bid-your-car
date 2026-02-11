package com.oblapleon.bidapi

import com.oblapleon.bidapi.feature.auction.controller.AuctionController
import com.oblapleon.bidapi.feature.item.controller.ItemController
import com.oblapleon.bidapi.feature.user.controller.AuthController
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.test.context.TestPropertySource

@SpringBootTest
@TestPropertySource(properties = [
    // Force H2 Database
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",

    // Disable Flyway (it causes issues with H2)
    "spring.flyway.enabled=false",

    // Let Hibernate create the schema
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",

    // Dummy JWT Secret
    "jwt.secret=testsecretkeyforunitandintegrationtestingonly123456",

    // Dummy Cloudflare Credentials
    "cloudflare.r2.bucket=test",
    "cloudflare.r2.access-key=test",
    "cloudflare.r2.secret-key=test",
    "cloudflare.r2.endpoint=https://test.r2.cloudflarestorage.com",

    // Dummy ImageKit
    "imagekit.url-endpoint=https://test.com"
])
class BidapiApplicationTests {

    @Autowired
    lateinit var context: ApplicationContext

    @Autowired
    lateinit var authController: AuthController

    @Autowired
    lateinit var itemController: ItemController

    @Autowired
    lateinit var auctionController: AuctionController

    @Test
    fun contextLoads() {
        // 1. Verify Context
        assertThat(context).isNotNull

        // 2. Verify Controllers are injected
        assertThat(authController).isNotNull
        assertThat(itemController).isNotNull
        assertThat(auctionController).isNotNull

        println("✅ Context loaded successfully using H2 database override")
    }
}