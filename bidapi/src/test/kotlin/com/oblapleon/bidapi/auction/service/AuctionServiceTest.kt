package com.oblapleon.bidapi.auction.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.common.exception.ForbiddenException
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional
import java.util.UUID
import kotlin.collections.get
import kotlin.test.Test
import kotlin.test.assertEquals

@ExtendWith(MockitoExtension::class)
class AuctionServiceTest {

    @Mock
    lateinit var auctionRepository: AuctionRepository
    @Mock
    lateinit var itemRepository: ItemRepository
    @Mock
    lateinit var userRepository: UserRepository
    @Mock
    lateinit var bidRepository: BidRepository

    @InjectMocks
    lateinit var auctionService: AuctionService

    private lateinit var seller: User
    private lateinit var bidder: User
    private lateinit var item: Item
    private lateinit var auction: Auction

    @BeforeEach
    fun setup() {
        // Mock Users
        seller = User(id = 1L, username = "Seller", email = "seller@test.com", password = "pw", enabled = true)
        bidder = User(id = 2L, username = "Bidder", email = "bidder@test.com", password = "pw", enabled = true)

        // Mock Item
        item = Item(
            id = UUID.randomUUID(),
            seller = seller,
            status = ItemStatus.AVAILABLE,
            year = 2020,
            make = "Toyota",
            model = "Camry",
            vin = "123",
            location = "NY",
            mileage = 1000,
            description = "Test Item",
            engine = "V6",
            drivetrain = "FWD",
            transmission = "Auto"
        )

        // Mock Auction
        auction = Auction(
            id = UUID.randomUUID(),
            item = item,
            startPrice = BigDecimal("100.00"),
            currentPrice = BigDecimal("100.00"),
            minBidIncrement = BigDecimal("10.00"),
            bidCount = 0,
            startTime = Instant.now().minus(1, ChronoUnit.HOURS),
            endTime = Instant.now().plus(1, ChronoUnit.HOURS),
            status = AuctionStatus.ACTIVE
        )
    }

    @Test
    fun `createAuction - should succeed when user owns item`() {
        // Given
        val req = CreateAuctionDto(
            itemId = item.id!!,
            startTime = Instant.now().plusSeconds(60),
            endTime = Instant.now().plusSeconds(3600),
            startPrice = BigDecimal("100.00")
        )

        // When
        whenever(itemRepository.findById(item.id!!)).thenReturn(Optional.of(item))
        whenever(auctionRepository.existsByItemIdAndStatusIn(any(), any())).thenReturn(false)

        // Mock the save behavior to return the object passed to it
        whenever(auctionRepository.save(any<Auction>())).thenAnswer { it.arguments[0] }

        val result = auctionService.createAuction(seller.id!!, req)

        // Then
        assertEquals(AuctionStatus.PENDING_APPROVAL, result.status)
        assertEquals(BigDecimal("100.00"), result.startPrice)
    }

    @Test
    fun `createAuction - should fail if user does not own item`() {
        val otherUserId = 99L
        val req = CreateAuctionDto(item.id!!, Instant.now(), Instant.now().plusSeconds(3600), BigDecimal.TEN)

        whenever(itemRepository.findById(item.id!!)).thenReturn(Optional.of(item))

        assertThrows<ForbiddenException> {
            auctionService.createAuction(otherUserId, req)
        }
    }

    @Test
    fun `placeBid - should succeed and update auction price`() {
        val bidAmount = BigDecimal("120.00")

        whenever(auctionRepository.findById(auction.id!!)).thenReturn(Optional.of(auction))
        whenever(userRepository.findById(bidder.id!!)).thenReturn(Optional.of(bidder))

        // Mock bid save
        whenever(bidRepository.save(any<Bid>())).thenAnswer { it.arguments[0] }

        auctionService.placeBid(auction.id!!, bidder.id!!, bidAmount)

        assertEquals(bidAmount, auction.currentPrice)
        assertEquals(1, auction.bidCount)
        verify(auctionRepository).save(auction)
    }

    @Test
    fun `placeBid - should throw exception if bid is too low`() {
        // Setup: Current Price 120, Increment 10. Next bid must be >= 130.
        auction.currentPrice = BigDecimal("120.00")
        auction.bidCount = 1

        whenever(auctionRepository.findById(auction.id!!)).thenReturn(Optional.of(auction))
        whenever(userRepository.findById(bidder.id!!)).thenReturn(Optional.of(bidder))

        val lowBid = BigDecimal("125.00")

        assertThrows<BadRequestException> {
            auctionService.placeBid(auction.id!!, bidder.id!!, lowBid)
        }
    }

    @Test
    fun `placeBid - should extend auction time (Anti-Sniping)`() {
        // Setup: Auction ends in 1 minute
        val originalEnd = Instant.now().plus(60, ChronoUnit.SECONDS)
        auction.endTime = originalEnd

        whenever(auctionRepository.findById(auction.id!!)).thenReturn(Optional.of(auction))
        whenever(userRepository.findById(bidder.id!!)).thenReturn(Optional.of(bidder))

        // Mock successful bid save
        whenever(bidRepository.save(any<Bid>())).thenAnswer {
            val bid = it.arguments[0] as Bid
            bid
        }

        auctionService.placeBid(auction.id!!, bidder.id!!, BigDecimal("150.00"))

        // Assert: End time is now AFTER the original end time (extended by 5 mins)
        assertTrue(auction.endTime.isAfter(originalEnd))
    }
}