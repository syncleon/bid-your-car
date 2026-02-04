package com.oblapleon.bidapi.feature.auction.repo

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.UUID

@Repository
interface AuctionRepo : JpaRepository<Auction, UUID> {

    fun findAllByStatus(status: AuctionStatus, pageable: Pageable): Page<Auction>

    // For automated tasks (no pagination needed usually, as we process all)
    fun findAllByStatusAndEndTimeBefore(status: AuctionStatus, now: LocalDateTime): List<Auction>

    // Optimized "Ending Soon" query
    fun findByStatusAndEndTimeAfter(
        status: AuctionStatus,
        now: LocalDateTime,
        pageable: Pageable
    ): Page<Auction>

    fun findAllByItemSellerId(sellerId: Long, pageable: Pageable): Page<Auction>

    fun findAllByWinnerUserIdAndStatus(userId: Long, status: AuctionStatus, pageable: Pageable): Page<Auction>

    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.id = :itemId AND a.status = 'ACTIVE'")
    fun isItemInActiveAuction(@Param("itemId") itemId: UUID): Boolean
}