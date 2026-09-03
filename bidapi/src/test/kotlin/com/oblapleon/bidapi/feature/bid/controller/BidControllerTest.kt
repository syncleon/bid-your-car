package com.oblapleon.bidapi.feature.bid.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.oblapleon.bidapi.common.config.SecurityConfig
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.security.JwtTokenProvider
import com.oblapleon.bidapi.common.service.RateLimitingService
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.entity.BidStatus
import com.oblapleon.bidapi.feature.bid.service.BidQueryService
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.item.entity.Item
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
import org.springframework.http.MediaType
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@WebMvcTest(BidController::class)
@Import(SecurityConfig::class)
class BidControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @MockBean
    lateinit var bidQueryService: BidQueryService

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
    @org.springframework.security.test.context.support.WithMockUser
    fun `getAuctionHistory should return paginated list of bids`() {
        val auctionId = UUID.randomUUID()
        val bidder = User(username = "bidder1", email = "bidder@test.com", password = "pw")
        bidder.id = 1L
        
        val bid = Bid(
            auction = Auction(
                item = Item(seller = bidder, year = 2020, make = "A", model = "B", vin = "123", location = "X", mileage = 10, description = "D"),
                startPrice = BigDecimal("100"),
                currentPrice = BigDecimal("100"),
                startTime = Instant.now(),
                endTime = Instant.now().plusSeconds(100)
            ).apply { id = auctionId },
            bidder = bidder,
            amount = BigDecimal("105"),
            bidTime = Instant.now(),
            status = BidStatus.ACCEPTED
        )
        bid.id = UUID.randomUUID()

        val bidDto = com.oblapleon.bidapi.feature.bid.dto.BidDto(
            id = bid.id!!,
            auctionId = bid.auction.id!!,
            bidderId = bidder.id!!,
            bidderName = bidder.username,
            amount = bid.amount,
            bidTime = bid.bidTime
        )

        val page = PageImpl(listOf(bidDto))

        whenever(bidQueryService.findHistoryByAuctionId(org.mockito.kotlin.eq(auctionId), any())).thenReturn(page as org.springframework.data.domain.Page<com.oblapleon.bidapi.feature.bid.dto.BidDto>)

        mockMvc.perform(
            get("/api/v1/bids/auction/{auctionId}", auctionId)
                .contentType(MediaType.APPLICATION_JSON)
        )
            .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].id").value(bid.id.toString()))
            .andExpect(jsonPath("$.content[0].amount").value(105))
    }
}
