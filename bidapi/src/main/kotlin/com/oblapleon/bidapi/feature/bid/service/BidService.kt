package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.common.service.BaseService
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repo.BidRepo
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class BidService(
    private val bidRepo: BidRepo
) : BaseService<Bid, UUID> {

    override fun findById(id: UUID): Bid {
        return bidRepo.findById(id).orElseThrow {
            NotFoundException("Bid with id $id not found.")
        }
    }

    override fun findAll(): List<Bid> = bidRepo.findAll()

    /**
     * Retrieves the current winning bid for an auction.
     */
    fun getHighestBidForAuction(auctionId: UUID): Bid? {
        return bidRepo.findFirstByAuctionIdOrderByAmountDesc(auctionId)
    }

    /**
     * Gets the full bidding history for an auction, most recent first.
     */
    fun getBidHistoryForAuction(auctionId: UUID): List<Bid> {
        return bidRepo.findAllByAuctionIdOrderByBidTimeDesc(auctionId)
    }

    /**
     * Finds all bids placed by a specific user across all auctions.
     */
    fun getBidsByUser(userId: Long): List<Bid> {
        return bidRepo.findAllByBidderIdOrderByBidTimeDesc(userId)
    }

    /**
     * Counts how many unique auctions a user has participated in.
     */
    fun countDistinctAuctionsParticipated(userId: Long): Long {
        return bidRepo.countDistinctAuctionIdByBidderId(userId)
    }

    @Transactional
    override fun delete(id: UUID) {
        val bid = findById(id)
        // Note: Generally, bids shouldn't be deleted in a live auction to maintain audit trails.
        // If an auction is active, this could break the currentHighestBid logic.
        bidRepo.delete(bid)
    }
}