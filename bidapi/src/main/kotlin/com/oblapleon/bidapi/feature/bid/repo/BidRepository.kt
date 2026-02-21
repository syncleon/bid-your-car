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

    fun findAllByAuctionIdOrderByAmountDesc(auctionId: UUID, pageable: Pageable): Page<Bid>
    fun findTopByAuctionOrderByAmountDesc(auction: Auction): Bid?
    fun findAllByBidderIdOrderByBidTimeDesc(bidderId: Long, pageable: Pageable): Page<Bid>

    @Query("SELECT COUNT(DISTINCT b.auction.id) FROM Bid b WHERE b.bidder.id = :bidderId")
    fun countDistinctAuctionsByBidderId(@Param("bidderId") bidderId: Long): Long

    @Query("SELECT COUNT(b) FROM Bid b WHERE b.bidder.id = :bidderId AND b.auction.status = 'ACTIVE'")
    fun countActiveBidsByBidderId(@Param("bidderId") bidderId: Long): Long
}