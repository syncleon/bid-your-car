package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.NotFoundException
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.toDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class BidQueryService(
    private val bidRepository: BidRepository
) {

    /**
     * Retrieves a bid by its unique ID.
     *
     * @param id The UUID of the bid to find.
     * @return The found [Bid].
     * @throws NotFoundException if no bid with the given ID exists.
     */
    fun findById(id: UUID): BidDto {
        return bidRepository.findById(id).orElseThrow {
            NotFoundException("Bid with id $id not found.")
        }.toDto()
    }

    /**
     * Retrieves the bidding history for a specific auction.
     * Results are ordered by bid amount in descending order.
     *
     * @param auctionId The UUID of the auction.
     * @param pageable Pagination and sorting information.
     * @return A [Page] of [Bid] objects.
     */
    fun findHistoryByAuctionId(auctionId: UUID, pageable: Pageable): Page<BidDto> {
        return bidRepository.findAllByAuctionIdOrderByAmountDesc(auctionId, pageable).map { it.toDto() }
    }

    /**
     * Retrieves the bidding history for a specific user.
     * Results are ordered by bid time in descending order.
     *
     * @param userId The ID of the user (bidder).
     * @param pageable Pagination and sorting information.
     * @return A [Page] of [Bid] objects.
     */
    fun findHistoryByUserId(userId: Long, pageable: Pageable): Page<BidDto> {
        return bidRepository.findAllByBidderIdOrderByBidTimeDesc(userId, pageable).map { it.toDto() }
    }

    /**
     * Counts the number of distinct auctions a user has participated in.
     *
     * @param userId The ID of the user.
     * @return The count of distinct auctions.
     */
    fun countAuctionsParticipated(userId: Long): Long {
        return bidRepository.countDistinctAuctionsByBidderId(userId)
    }
}