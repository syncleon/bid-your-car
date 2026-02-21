package com.oblapleon.bidapi.feature.auction.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import jakarta.persistence.LockModeType
import jakarta.persistence.QueryHint
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.jpa.repository.QueryHints
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

@Repository
interface AuctionRepository : BaseRepository<Auction, UUID> {

    fun findByStatusAndEndTimeAfterOrderByEndTimeAsc(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): Page<Auction>

    fun findByStatusAndStartTimeBeforeOrderByStartTimeDesc(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): Page<Auction>

    @Query("SELECT a FROM Auction a WHERE a.item.seller.id = :sellerId")
    fun findAllBySellerId(@Param("sellerId") sellerId: Long, pageable: Pageable): Page<Auction>

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

    fun findAllByStatusAndEndTimeBefore(
        status: AuctionStatus,
        now: Instant,
        pageable: Pageable
    ): List<Auction>

    @Modifying
    @Query("UPDATE Auction a SET a.status = 'CANCELLED' WHERE a.item.seller.id = :sellerId AND a.status = 'ACTIVE'")
    fun cancelAllActiveAuctionsBySellerId(@Param("sellerId") sellerId: Long)

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    fun findByIdWithPessimisticWriteLock(@Param("id") id: UUID): Optional<Auction>

    fun findByStatus(status: AuctionStatus, pageable: Pageable): Page<Auction>
    fun findByStatusOrderByEndTimeDesc(status: AuctionStatus, pageable: Pageable): Page<Auction>

    @Query("SELECT COUNT(a) > 0 FROM Auction a WHERE a.item.seller.id = :sellerId AND a.status = 'ACTIVE'")
    fun existsActiveAuctionsBySellerId(@Param("sellerId") sellerId: Long): Boolean
}
