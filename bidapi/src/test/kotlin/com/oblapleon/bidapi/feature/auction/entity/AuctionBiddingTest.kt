package com.oblapleon.bidapi.feature.auction.entity

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.user.entity.User
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

class AuctionBiddingTest {

    private fun createSampleAuction(startPrice: BigDecimal = BigDecimal("10000.00")): Triple<Auction, User, User> {
        val seller = User(username = "seller", email = "seller@test.com", password = "pw").apply { id = 1L }
        val bidder1 = User(username = "bidder1", email = "b1@test.com", password = "pw").apply { id = 2L }
        val bidder2 = User(username = "bidder2", email = "b2@test.com", password = "pw").apply { id = 3L }

        val item = Item(
            seller = seller,
            status = ItemStatus.ACTIVE_AUCTION,
            year = 2021,
            make = "Porsche",
            model = "911",
            vin = "WP0AB2A99MS123456",
            location = "Miami, FL",
            mileage = 5000,
            description = "Mint condition"
        ).apply { id = UUID.randomUUID() }

        val now = Instant.now()
        val auction = Auction(
            item = item,
            startPrice = startPrice,
            currentPrice = startPrice,
            startTime = now.minus(1, ChronoUnit.DAYS),
            endTime = now.plus(7, ChronoUnit.DAYS),
            status = AuctionStatus.ACTIVE,
            isNoReserve = true
        ).apply { id = UUID.randomUUID() }

        return Triple(auction, bidder1, bidder2)
    }

    @Test
    fun `direct bidding immediately sets current price to bid amount without proxy escalation`() {
        val (auction, bidder1, bidder2) = createSampleAuction(BigDecimal("10000.00"))
        val now = Instant.now()

        // First bid at starting price 10000
        val bids1 = auction.processBidRequest(bidder1, BigDecimal("10000.00"), now)
        assertEquals(1, bids1.size)
        assertEquals(BigDecimal("10000.00"), auction.currentPrice)
        assertEquals(1, auction.bidCount)
        assertEquals(bidder1.id, auction.winningBid?.bidder?.id)

        // Bidder 2 bids directly 35000 (when minimum next would be 10100)
        val bids2 = auction.processBidRequest(bidder2, BigDecimal("35000.00"), now.plusSeconds(10))
        assertEquals(1, bids2.size)
        // Price should IMMEDIATELY become 35000 (no proxy steps)
        assertEquals(BigDecimal("35000.00"), auction.currentPrice)
        assertEquals(2, auction.bidCount)
        assertEquals(bidder2.id, auction.winningBid?.bidder?.id)
        assertEquals(BigDecimal("35000.00"), bids2[0].amount)

        // Next minimum bid from bidder 1 at 35000 tier (tier 15k-50k has increment 250)
        // Trying to bid 35100 should fail because minimum required is 35250
        assertThrows<BadRequestException> {
            auction.processBidRequest(bidder1, BigDecimal("35100.00"), now.plusSeconds(20))
        }

        // Bidding 35250 should succeed
        val bids3 = auction.processBidRequest(bidder1, BigDecimal("35250.00"), now.plusSeconds(30))
        assertEquals(BigDecimal("35250.00"), auction.currentPrice)
        assertEquals(3, auction.bidCount)
        assertEquals(bidder1.id, auction.winningBid?.bidder?.id)
    }

    @Test
    fun `highest bidder cannot bid against themselves`() {
        val (auction, bidder1, _) = createSampleAuction(BigDecimal("10000.00"))
        val now = Instant.now()

        auction.processBidRequest(bidder1, BigDecimal("10000.00"), now)

        val exception = assertThrows<BadRequestException> {
            auction.processBidRequest(bidder1, BigDecimal("15000.00"), now.plusSeconds(5))
        }
        assertEquals("You are already the highest bidder.", exception.message)
    }

    @Test
    fun `bid in final 60 seconds resets end time to 1 minute from bid placement`() {
        val (auction, bidder1, bidder2) = createSampleAuction(BigDecimal("10000.00"))
        val now = Instant.now()

        // Set end time to 30 seconds from now
        auction.endTime = now.plus(30, ChronoUnit.SECONDS)

        auction.processBidRequest(bidder1, BigDecimal("10000.00"), now)

        // End time should be extended to exactly now + 60s
        val expectedEndTime = now.plus(60, ChronoUnit.SECONDS)
        assertEquals(expectedEndTime, auction.endTime)

        // Another bid 15 seconds later (now + 15s, with 45s left)
        val later = now.plus(15, ChronoUnit.SECONDS)
        auction.processBidRequest(bidder2, BigDecimal("10100.00"), later)

        // End time should now be later + 60s
        assertEquals(later.plus(60, ChronoUnit.SECONDS), auction.endTime)
    }

    @Test
    fun `bid with more than 60 seconds remaining does not alter end time`() {
        val (auction, bidder1, _) = createSampleAuction(BigDecimal("10000.00"))
        val now = Instant.now()
        val originalEndTime = now.plus(2, ChronoUnit.HOURS)
        auction.endTime = originalEndTime

        auction.processBidRequest(bidder1, BigDecimal("10000.00"), now)

        assertEquals(originalEndTime, auction.endTime)
    }
}
