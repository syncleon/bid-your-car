package com.oblapleon.bidapi.feature.auction.repo

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.UUID

@Repository
interface AuctionRepo : JpaRepository<Auction, UUID> {

    // Basic status filtering
    fun findAllByStatus(status: AuctionStatus): List<Auction>

    // Automated Task: Find auctions that reached their end time but are still marked ACTIVE
    fun findAllByStatusAndEndTimeBefore(status: AuctionStatus, now: LocalDateTime): List<Auction>

    // Discovery: Get active auctions ending soonest
    fun findByStatusAndEndTimeAfterOrderByEndTimeAsc(status: AuctionStatus, now: LocalDateTime): List<Auction>

    // User History: Get all auctions created by a specific seller
    fun findAllByItemSellerId(sellerId: Long): List<Auction>

    // User History: Get all auctions won by a specific user
    fun findAllByWinnerUserIdAndStatus(userId: Long, status: AuctionStatus): List<Auction>

    // Validation: Check if an item is already tied to an ongoing auction
    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.id = :itemId AND a.status = 'ACTIVE'")
    fun isItemInActiveAuction(@Param("itemId") itemId: UUID): Boolean
}