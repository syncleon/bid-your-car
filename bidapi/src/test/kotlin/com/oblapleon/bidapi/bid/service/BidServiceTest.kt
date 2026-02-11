package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.user.entity.User
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@ExtendWith(MockitoExtension::class)
class BidServiceTest {

    @Mock lateinit var bidRepository: BidRepository
    @InjectMocks lateinit var bidService: BidService

    @Test
    fun `findHistoryByAuctionId - should return page of bids`() {
        val auctionId = UUID.randomUUID()
        val bidderUser = User(id=1L, username="bidder", password="pw", email="bidder@test.com")

        val bid1 = Bid(
            id = UUID.randomUUID(),
            auction = Auction(
                id = auctionId,
                startPrice = BigDecimal.TEN,
                currentPrice = BigDecimal.TEN,
                startTime = Instant.now(),
                endTime = Instant.now(),
                item = mock()
            ),
            bidder = bidderUser,
            amount = BigDecimal("100.00")
        )

        val pageRequest = PageRequest.of(0, 10)
        val page = PageImpl(listOf(bid1))

        whenever(bidRepository.findAllByAuctionIdOrderByAmountDesc(auctionId, pageRequest)).thenReturn(page)

        val result = bidService.findHistoryByAuctionId(auctionId, pageRequest)

        assertEquals(1, result.content.size)
        assertEquals(BigDecimal("100.00"), result.content[0].amount)
    }

    @Test
    fun `countAuctionsParticipated - should return count`() {
        val userId = 10L
        whenever(bidRepository.countDistinctAuctionsByBidderId(userId)).thenReturn(5L)

        val count = bidService.countAuctionsParticipated(userId)
        assertEquals(5L, count)
    }
}