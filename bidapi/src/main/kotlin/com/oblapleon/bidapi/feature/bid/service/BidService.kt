package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class BidService(
    private val bidRepository: BidRepository
) {

    fun findById(id: UUID): Bid {
        return bidRepository.findById(id).orElseThrow {
            NotFoundException("Bid with id $id not found.")
        }
    }

    /**
     * Returns the bid history for a specific auction (Highest value first).
     */
    fun findHistoryByAuctionId(auctionId: UUID, pageable: Pageable): Page<Bid> {
        return bidRepository.findAllByAuctionIdOrderByAmountDesc(auctionId, pageable)
    }

    /**
     * Returns the bid history for a specific user (Most recent first).
     */
    fun findHistoryByUserId(userId: Long, pageable: Pageable): Page<Bid> {
        return bidRepository.findAllByBidderIdOrderByBidTimeDesc(userId, pageable)
    }

    /**
     * Returns statistics for a user profile.
     */
    fun countAuctionsParticipated(userId: Long): Long {
        return bidRepository.countDistinctAuctionsByBidderId(userId)
    }
}