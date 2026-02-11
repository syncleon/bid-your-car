package com.oblapleon.bidapi.feature.bid.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface BidRepository : BaseRepository<Bid, UUID> {

    /**
     * Finds all bids for a specific auction, ordered by amount (Highest First).
     */
    fun findAllByAuctionIdOrderByAmountDesc(auctionId: UUID, pageable: Pageable): Page<Bid>

    /**
     * Finds the highest bid for an auction.
     * Used by AuctionService to determine the winner.
     */
    fun findTopByAuctionOrderByAmountDesc(auction: Auction): Bid?

    /**
     * Finds bidding history for a specific user (My Bids), ordered by time (Newest First).
     */
    fun findAllByBidderIdOrderByBidTimeDesc(bidderId: Long, pageable: Pageable): Page<Bid>

    /**
     * Statistics: Count unique auctions a user has participated in.
     */
    @Query("SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    fun countDistinctAuctionsByBidderId(@Param("bidderId") bidderId: Long): Long
}