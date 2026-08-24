package com.oblapleon.bidapi.common.service

import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.repository.ItemImageRepository
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Profile("!prod")
class SeedingCleanupService(
    private val bidRepository: BidRepository,
    private val auctionRepository: AuctionRepository,
    private val itemImageRepository: ItemImageRepository,
    private val itemRepository: ItemRepository
) {
    /**
     * Clears all seeded data from the database.
     * This includes bids, auctions, item images, and items.
     * Resets any winning bids or users on auctions before deleting.
     */
    @Transactional
    fun clearAllData() {
        auctionRepository.findAll().forEach { auction ->
            if (auction.winningBid != null || auction.winnerUser != null) {
                auction.winningBid = null
                auction.winnerUser = null
                auctionRepository.save(auction)
            }
        }
        auctionRepository.flush()

        bidRepository.deleteAllInBatch()
        auctionRepository.deleteAllInBatch()
        itemImageRepository.deleteAllInBatch()
        itemRepository.deleteAllInBatch()
    }
}
