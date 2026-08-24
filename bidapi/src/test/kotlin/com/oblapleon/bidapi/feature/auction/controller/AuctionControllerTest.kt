package com.oblapleon.bidapi.feature.auction.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.config.SecurityConfig
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.RateLimitingService
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.service.BiddingService
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.security.HttpCookieOAuth2AuthorizationRequestRepository
import com.oblapleon.bidapi.feature.user.security.OAuth2LoginSuccessHandler
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.http.MediaType
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@WebMvcTest(AuctionController::class)
@Import(SecurityConfig::class)
class AuctionControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockBean
    lateinit var auctionService: AuctionService

    @MockBean
    lateinit var biddingService: BiddingService

    @MockBean
    lateinit var rateLimitingService: RateLimitingService

    @MockBean
    lateinit var authorizationHelper: AuthorizationHelper

    @MockBean
    lateinit var jwtTokenProvider: JwtTokenProvider

    @MockBean
    lateinit var jwtDecoder: JwtDecoder

    @MockBean
    lateinit var oAuth2LoginSuccessHandler: OAuth2LoginSuccessHandler

    @MockBean
    lateinit var httpCookieOAuth2AuthorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository

    @Test
    fun `getPublicAuctions should return paginated list of auctions`() {
        val seller = User(username = "seller1", email = "seller@test.com", password = "pw")
        seller.id = 1L
        
        val item = Item(
            seller = seller,
            status = ItemStatus.ACTIVE_AUCTION,
            year = 2020,
            make = "Toyota",
            model = "Camry",
            vin = "12345678901234567",
            location = "NY",
            mileage = 10000,
            description = "Great car"
        )
        item.id = UUID.randomUUID()
        
        val auction = Auction(
            item = item,
            startPrice = BigDecimal("10000"),
            currentPrice = BigDecimal("10000"),
            startTime = Instant.now(),
            endTime = Instant.now().plusSeconds(86400),
            status = AuctionStatus.ACTIVE
        )
        auction.id = UUID.randomUUID()

        val page = PageImpl(listOf(auction))

        whenever(auctionService.findAuctionsByCriteria(org.mockito.kotlin.anyOrNull(), org.mockito.kotlin.anyOrNull(), any())).thenReturn(page)

        mockMvc.perform(
            get("/api/v1/auctions")
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].id").value(auction.id.toString()))
            .andExpect(jsonPath("$.content[0].startPrice").value(10000))
    }
}
