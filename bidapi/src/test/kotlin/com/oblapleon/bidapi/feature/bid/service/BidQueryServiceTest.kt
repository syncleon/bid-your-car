package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.user.entity.User
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@ExtendWith(MockitoExtension::class)
class BidQueryServiceTest {

    @Mock
    private lateinit var bidRepository: BidRepository

    @InjectMocks
    private lateinit var bidQueryService: BidQueryService

    private fun mockBid(
        id: UUID = UUID.randomUUID(),
        amount: BigDecimal = BigDecimal("100.00")
    ): Bid {
        val auction = mock(Auction::class.java)
        val bidder = mock(User::class.java)
        return Bid(
            id = id,
            auction = auction,
            bidder = bidder,
            amount = amount,
            bidTime = Instant.now()
        )
    }

    @Test
    fun `findById should return bid when found`() {
        val id = UUID.randomUUID()
        val bid = mockBid(id = id, amount = BigDecimal("100.00"))

        `when`(bidRepository.findById(id)).thenReturn(Optional.of(bid))

        val result = bidQueryService.findById(id)

        assertNotNull(result)
        assertEquals(id, result.id)
    }

    @Test
    fun `findById should throw NotFoundException when not found`() {
        val id = UUID.randomUUID()
        `when`(bidRepository.findById(id)).thenReturn(Optional.empty())

        assertThrows<NotFoundException> {
            bidQueryService.findById(id)
        }
    }

    @Test
    fun `findHistoryByAuctionId should return page of bids`() {
        val auctionId = UUID.randomUUID()
        val pageable = PageRequest.of(0, 10)
        val bids = listOf(
            mockBid(amount = BigDecimal("100.00")),
            mockBid(amount = BigDecimal("150.00"))
        )
        val expectedPage = PageImpl(bids, pageable, bids.size.toLong())

        `when`(bidRepository.findAllByAuctionIdOrderByAmountDesc(auctionId, pageable)).thenReturn(expectedPage)

        val result = bidQueryService.findHistoryByAuctionId(auctionId, pageable)

        assertNotNull(result)
        assertEquals(2, result.content.size)
    }

    @Test
    fun `countAuctionsParticipated should return count`() {
        val userId = 1L
        `when`(bidRepository.countDistinctAuctionsByBidderId(userId)).thenReturn(5L)

        val result = bidQueryService.countAuctionsParticipated(userId)

        assertEquals(5L, result)
    }
}
