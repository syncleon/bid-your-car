package com.oblapleon.bidapi.feature.auction.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.Lock

@Repository
interface AuctionRepository : BaseRepository<Auction, UUID> {

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    fun findByIdWithItemAndSeller(@Param("id") id: UUID): Optional<Auction>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    fun findByIdWithItemAndSellerPessimistic(@Param("id") id: UUID): Optional<Auction>

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findByStatusAndEndTimeAfterOrderByEndTimeAsc(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): Page<Auction>

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findByStatusAndStartTimeBeforeOrderByStartTimeDesc(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): Page<Auction>

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    @Query("SELECT a FROM Auction a WHERE a.item.seller.id = :sellerId")
    fun findAllBySellerId(@Param("sellerId") sellerId: Long, pageable: Pageable): Page<Auction>

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    @Query("SELECT a FROM Auction a WHERE a.winnerUser.id = :userId")
    fun findAllWonByUserId(@Param("userId") userId: Long, pageable: Pageable): Page<Auction>

    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.id = :itemId AND a.status IN :statuses")
    fun existsByItemIdAndStatusIn(
        @Param("itemId") itemId: UUID,
        @Param("statuses") statuses: Collection<AuctionStatus>
    ): Boolean

    @Query(
        """
        SELECT COUNT(a) > 0 
        FROM Auction a 
        WHERE a.item.seller.id = :sellerId 
        AND a.status = 'ACTIVE' 
        AND a.bidCount > 0
    """
    )
    fun existsBySellerIdAndStatusAndBidsIsNotEmpty(@Param("sellerId") sellerId: Long): Boolean

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findAllByStatusAndEndTimeBefore(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): List<Auction>

    // ✅ NEW for scheduled activation
    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findAllByStatusAndStartTimeBefore(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): List<Auction>

    @Query("SELECT a.id FROM Auction a WHERE a.status = :status AND a.endTime < :now")
    fun findIdsByStatusAndEndTimeBefore(@Param("status") status: AuctionStatus, @Param("now") now: Instant, pageable: Pageable): List<UUID>

    @Query("SELECT a.id FROM Auction a WHERE a.status = :status AND a.startTime < :now")
    fun findIdsByStatusAndStartTimeBefore(@Param("status") status: AuctionStatus, @Param("now") now: Instant, pageable: Pageable): List<UUID>

    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.id = :itemId AND a.bidCount > :count")
    fun existsByItemIdAndBidCountGreaterThan(@Param("itemId") itemId: UUID, @Param("count") count: Int): Boolean

    @Modifying
    fun deleteByItemId(itemId: UUID)

    @Modifying
    @Query("UPDATE Auction a SET a.status = 'CANCELLED' WHERE a.item.seller.id = :sellerId AND a.status = 'ACTIVE'")
    fun cancelAllActiveAuctionsBySellerId(@Param("sellerId") sellerId: Long)


    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findByStatus(status: AuctionStatus, pageable: Pageable): Page<Auction>

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findByStatusOrderByEndTimeDesc(status: AuctionStatus, pageable: Pageable): Page<Auction>

    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.seller.id = :sellerId AND a.status = 'ACTIVE'")
    fun existsActiveAuctionsBySellerId(@Param("sellerId") sellerId: Long): Boolean

    @EntityGraph(attributePaths = ["item", "item.seller", "winnerUser"])
    fun findAllByOrderByEndTimeDesc(pageable: Pageable): Page<Auction>
}