package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import net.datafaker.Faker
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class AuctionSeederService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository
) {
    private val faker = Faker()

    @Transactional
    fun seedAuctions(count: Int) {
        val page = itemRepository.findReadyForAuction(PageRequest.of(0, count))
        val items = page.content
        if (items.isEmpty()) {
            throw IllegalStateException("No available items found to create auctions. Please seed items first.")
        }

        val users = userRepository.findAll()
        if (users.size < 2) {
            throw IllegalStateException("Need at least 2 users in DB to simulate bidding.")
        }

        items.forEach { item ->
            createRandomAuction(item, users)
        }
    }

    private fun createRandomAuction(item: Item, allUsers: List<User>) {
        val status = faker.options().option(AuctionStatus::class.java)
        val startPrice = BigDecimal(faker.number().numberBetween(5000, 50000))
        val hasReserve = faker.bool().bool()
        val reservePrice = if (hasReserve) startPrice.multiply(BigDecimal("1.2")) else null
        val now = Instant.now()
        var startTime = now
        var endTime = now.plus(7, ChronoUnit.DAYS)
        when (status) {
            AuctionStatus.ACTIVE -> {
                startTime = now.minus(faker.number().numberBetween(1L, 3L), ChronoUnit.DAYS)
                endTime = now.plus(faker.number().numberBetween(1L, 4L), ChronoUnit.DAYS)
            }
            AuctionStatus.SOLD, AuctionStatus.UNSOLD -> {
                startTime = now.minus(10, ChronoUnit.DAYS)
                endTime = now.minus(2, ChronoUnit.DAYS)
            }
            AuctionStatus.SCHEDULED -> {
                startTime = now.plus(2, ChronoUnit.DAYS)
                endTime = now.plus(9, ChronoUnit.DAYS)
            }
            else -> {}
        }

        val auction = Auction(
            item = item,
            startPrice = startPrice,
            currentPrice = startPrice,
            isNoReserve = item.isNoReserve,
            reservePrice = reservePrice,
            startTime = startTime,
            endTime = endTime,
            status = status,
            bidCount = 0
        )
        auctionRepository.save(auction)
        if (status == AuctionStatus.ACTIVE || status == AuctionStatus.SOLD || status == AuctionStatus.UNSOLD) {
            val shouldHaveBids = if (status == AuctionStatus.UNSOLD) faker.bool().bool() else true

            if (shouldHaveBids) {
                simulateBiddingWar(auction, allUsers)
            }
        }
        if (status == AuctionStatus.SOLD && auction.winnerUser == null) {
            auction.status = AuctionStatus.UNSOLD
            auctionRepository.save(auction)
        }
        
        when (auction.status) {
            AuctionStatus.ACTIVE -> item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.ACTIVE_AUCTION
            AuctionStatus.SOLD -> item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.SOLD
            AuctionStatus.UNSOLD -> item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.UNSOLD
            AuctionStatus.SCHEDULED -> item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.LISTED_AUCTION
            AuctionStatus.PENDING_APPROVAL -> item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.PENDING_AUCTION
            else -> {}
        }
        itemRepository.save(item)
    }

    private fun simulateBiddingWar(auction: Auction, allUsers: List<User>) {
        val eligibleBidders = allUsers.filter { it.id != auction.item.seller.id }
        if (eligibleBidders.isEmpty()) return
        val bidCount = faker.number().numberBetween(3, 15)
        var currentPrice = auction.startPrice
        val durationSeconds = ChronoUnit.SECONDS.between(auction.startTime,
            if(auction.endTime.isBefore(Instant.now())) auction.endTime else Instant.now()
        )
        val timeStep = if (bidCount > 0) durationSeconds / bidCount else 0

        val bids = mutableListOf<Bid>()

        for (i in 1..bidCount) {
            val bidder = eligibleBidders.random()
            val increment = BigDecimal(faker.number().numberBetween(100, 500))
            currentPrice = currentPrice.add(increment)
            val bidTime = auction.startTime.plusSeconds(timeStep * i)
            val bid = Bid(
                auction = auction,
                bidder = bidder,
                amount = currentPrice,
                bidTime = bidTime
            )
            bids.add(bid)
        }

        if (bids.isNotEmpty()) {
            val savedBids = bidRepository.saveAll(bids)
            val winningBid = savedBids.last()

            auction.currentPrice = winningBid.amount
            auction.bidCount = savedBids.size
            auction.winningBid = winningBid
            val reserve = auction.reservePrice
            if (reserve == null || winningBid.amount >= reserve) {
                if (auction.status != AuctionStatus.ACTIVE) {
                    auction.status = AuctionStatus.SOLD
                    auction.winnerUser = winningBid.bidder
                    auction.item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.SOLD
                }
            } else if (auction.status != AuctionStatus.ACTIVE) {
                auction.status = AuctionStatus.UNSOLD
                auction.item.status = com.oblapleon.bidapi.feature.item.entity.ItemStatus.UNSOLD
            }

            auctionRepository.save(auction)
            itemRepository.save(auction.item)
        }
    }
}