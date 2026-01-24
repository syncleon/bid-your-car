package com.oblapleon.bidapi.feature.bid.repo


import com.oblapleon.bidapi.feature.bid.entity.Bid
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface BidRepo : JpaRepository<Bid, UUID> {

    // Corrected: Returns the single highest bid
    fun findFirstByAuctionIdOrderByAmountDesc(auctionId: UUID): Bid?

    // Returns history for a specific auction
    fun findAllByAuctionIdOrderByBidTimeDesc(auctionId: UUID): List<Bid>

    // Returns history for a specific user
    fun findAllByBidderIdOrderByBidTimeDesc(bidderId: Long): List<Bid>

    // Statistical query
    @Query("SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    fun countDistinctAuctionIdByBidderId(bidderId: Long): Long
}