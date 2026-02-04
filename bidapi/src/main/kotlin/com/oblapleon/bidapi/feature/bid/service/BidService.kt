package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exceptions.NotFoundException
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repo.BidRepo
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true) // Mostly read operations here
class BidService(
    private val bidRepo: BidRepo
) {

    fun findById(id: UUID): Bid {
        return bidRepo.findById(id).orElseThrow {
            NotFoundException("Bid with id $id not found.")
        }
    }

    /**
     * Gets the full bidding history for an auction, most recent first.
     */
    fun getBidHistoryForAuction(auctionId: UUID, pageable: Pageable): Page<Bid> {
        return bidRepo.findAllByAuctionId(auctionId, pageable)
    }

    /**
     * Finds all bids placed by a specific user across all auctions.
     */
    fun getBidsByUser(userId: Long, pageable: Pageable): Page<Bid> {
        return bidRepo.findAllByBidderId(userId, pageable)
    }

    /**
     * Counts how many unique auctions a user has participated in.
     */
    fun countDistinctAuctionsParticipated(userId: Long): Long {
        return bidRepo.countDistinctAuctionIdByBidderId(userId)
    }
}