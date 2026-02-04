package com.oblapleon.bidapi.feature.bid.repo

import com.oblapleon.bidapi.feature.bid.entity.Bid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface BidRepo : JpaRepository<Bid, UUID> {

    // Returns history for a specific auction (Paginated)
    fun findAllByAuctionId(auctionId: UUID, pageable: Pageable): Page<Bid>

    // Returns history for a specific user (Paginated)
    fun findAllByBidderId(bidderId: Long, pageable: Pageable): Page<Bid>

    // Statistical query: How many unique auctions has a user participated in?
    @Query("SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    fun countDistinctAuctionIdByBidderId(bidderId: Long): Long
}