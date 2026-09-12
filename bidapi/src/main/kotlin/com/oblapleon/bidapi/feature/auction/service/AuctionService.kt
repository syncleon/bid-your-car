package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.common.exception.*
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.event.BidPlacedEvent
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil
import com.oblapleon.bidapi.feature.bid.entity.Bid
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.user.entity.User
import com.oblapleon.bidapi.feature.user.repository.UserRepository
import io.micrometer.core.instrument.MeterRegistry
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.springframework.cache.annotation.Cacheable
import org.springframework.cache.annotation.CacheEvict
import java.util.*

@Service
class AuctionService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
    private val bidRepository: BidRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val meterRegistry: MeterRegistry,
    private val cacheManager: org.springframework.cache.CacheManager
) {

    private val logger = LoggerFactory.getLogger(AuctionService::class.java)

    /**
     * Retrieves an auction by its ID.
     *
     * @param id The UUID of the auction.
     * @return The found [Auction].
     * @throws NotFoundException if the auction is not found.
     */
    @Cacheable(value = ["auctions"], key = "#id")
    fun findById(id: UUID): Auction {
        return auctionRepository.findById(id)
            .orElseThrow { NotFoundException("Auction not found.") }
    }

    @Transactional(readOnly = true)
    fun getAuctionDtoById(id: UUID): com.oblapleon.bidapi.feature.auction.dto.AuctionDto {
        val auction = findById(id)
        return auction.toDto()
    }

    /**
     * Finds auctions matching specific status and filter criteria.
     *
     * @param status The target [AuctionStatus]. Defaults to ACTIVE if null.
     * @param filterType Sorting logic (e.g., "ending_soon", "just_listed").
     * @param pageable Pagination and sorting information.
     * @return A [Page] of [Auction] objects.
     */
    @Transactional(readOnly = true)
    fun getPublicAuctionsDto(status: AuctionStatus?, filterType: String?, pageable: Pageable): Page<com.oblapleon.bidapi.feature.auction.dto.AuctionDto> {
        return findAuctionsByCriteria(status, filterType, pageable).map { it.toDto() }
    }

    fun findAuctionsByCriteria(
        status: AuctionStatus?,
        filterType: String?,
        pageable: Pageable
    ): Page<Auction> {
        val now = Instant.now()
        val targetStatus = status ?: AuctionStatus.ACTIVE

        if (targetStatus != AuctionStatus.ACTIVE) {
            return auctionRepository.findByStatusOrderByEndTimeDesc(targetStatus, pageable)
        }

        return when (filterType?.lowercase()) {
            "ending_soon" -> auctionRepository.findByStatusAndEndTimeAfterOrderByEndTimeAsc(targetStatus, now, pageable)
            "just_listed" -> auctionRepository.findByStatusAndStartTimeBeforeOrderByStartTimeDesc(targetStatus, now, pageable)
            else -> auctionRepository.findByStatusOrderByEndTimeDesc(targetStatus, pageable)
        }
    }

    fun findAdminAuctionsByCriteria(
        status: AuctionStatus?,
        pageable: Pageable
    ): Page<Auction> {
        return if (status != null) {
            auctionRepository.findByStatusOrderByEndTimeDesc(status, pageable)
        } else {
            auctionRepository.findAllByOrderByEndTimeDesc(pageable) 
        }
    }

    /**
     * Retrieves a paginated list of recently sold auctions.
     */
    fun findSoldAuctionsRecentlyAdded(pageable: Pageable): Page<Auction> {
        return auctionRepository.findByStatusOrderByEndTimeDesc(AuctionStatus.SOLD, pageable)
    }

    /**
     * Retrieves all auctions created by a specific seller.
     */
    fun findBySeller(sellerId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllBySellerId(sellerId, pageable)
    }

    /**
     * Retrieves all auctions won by a specific user.
     */
    fun findWonByUser(userId: Long, pageable: Pageable): Page<Auction> {
        return auctionRepository.findAllWonByUserId(userId, pageable)
    }

    /**
     * Creates a new auction for an item in DRAFT or UNSOLD status.
     * Sets the auction to PENDING_APPROVAL status.
     *
     * @param request The data for creating the auction.
     * @return The created [Auction].
     * @throws ConflictException if the item cannot be auctioned.
     * @throws BadRequestException if the end time is before the start time.
     */
    @Transactional
    fun createAuction(request: CreateAuctionDto, creatorId: Long): Auction {
        val item = itemRepository.findByIdWithLock(request.itemId)
            .orElseThrow { NotFoundException("Item not found") }

        if (item.seller.id != creatorId) {
            throw ForbiddenException("You do not own this item.")
        }

        if (item.status != ItemStatus.DRAFT && item.status != ItemStatus.UNSOLD && item.status != ItemStatus.REJECTED) {
            throw ConflictException("Item is not available for a new auction.")
        }

        val activeStatuses = listOf(AuctionStatus.ACTIVE, AuctionStatus.PENDING_APPROVAL, AuctionStatus.SCHEDULED)
        if (auctionRepository.existsByItemIdAndStatusIn(item.id!!, activeStatuses)) {
            throw ConflictException("Item is already linked to an active or pending auction.")
        }

        if (request.endTime.isBefore(request.startTime)) {
            throw BadRequestException("End time must be after start time.")
        }

        val auction = Auction(
            item = item,
            startPrice = request.startPrice,
            currentPrice = request.startPrice,
            reservePrice = request.reservePrice,
            isNoReserve = request.isNoReserve,
            startTime = request.startTime,
            endTime = request.endTime,
            status = AuctionStatus.PENDING_APPROVAL
        )

        val savedAuction = auctionRepository.save(auction)
        item.status = ItemStatus.PENDING_AUCTION
        item.auctionId = savedAuction.id
        itemRepository.save(item)
        cacheManager.getCache("items")?.evict(item.id!!)

        return savedAuction
    }

    /**
     * Approves an auction to go live or be scheduled.
     * Only admins can perform this action.
     *
     * @param auctionId The UUID of the auction.
     * @throws ConflictException if the auction is not pending approval.
     */
    @Transactional
    @CacheEvict(value = ["auctions"], key = "#auctionId")
    fun approveAuction(auctionId: UUID) {
        // Admin role already enforced by @PreAuthorize on the controller
        val auction = findById(auctionId)

        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Auction is not pending approval.")
        }

        val now = Instant.now()

        // Original requested duration must be valid
        val originalDurationSeconds = ChronoUnit.SECONDS.between(auction.startTime, auction.endTime)
        if (originalDurationSeconds <= 0) {
            throw BadRequestException("Auction duration must be greater than zero.")
        }
        val maxDurationSeconds = 30L * 24 * 60 * 60 // 30 days
        if (originalDurationSeconds > maxDurationSeconds) {
            throw BadRequestException("Auction duration cannot exceed 30 days.")
        }

        // Small tolerance to avoid edge cases when approval happens "at start time"
        val activationToleranceSeconds = 5L
        val activateImmediatelyThreshold = now.plusSeconds(activationToleranceSeconds)

        if (!auction.startTime.isAfter(activateImmediatelyThreshold)) {
            // Requested start time is in the past OR now-ish => activate immediately
            auction.startTime = now
            auction.endTime = now.plusSeconds(originalDurationSeconds)
            auction.status = AuctionStatus.ACTIVE
            auction.item.status = ItemStatus.ACTIVE_AUCTION
        } else {
            // Start time is in the future => keep requested schedule
            auction.status = AuctionStatus.SCHEDULED
            auction.item.status = ItemStatus.LISTED_AUCTION
        }
        
        auctionRepository.save(auction)
    }

    /**
     * Cancels an auction, reverting the item back to DRAFT.
     * Restricts cancellation if the auction is ACTIVE or has bids, unless performed by an admin.
     *
     * @param id The UUID of the auction to cancel.
     * @param requestedById The ID of the user requesting the cancellation.
     * @param isAdmin Whether the user is an admin.
     * @throws ConflictException if cancellation rules are violated.
     */
    @Transactional
    @CacheEvict(value = ["auctions"], key = "#id")
    fun cancelAuction(id: UUID, requestedById: Long, isAdmin: Boolean) {
        val auction = findById(id)

        if (auction.item.seller.id != requestedById && !isAdmin) {
            throw ForbiddenException("You can only cancel your own auctions.")
        }

        if (auction.status == AuctionStatus.ACTIVE && !isAdmin) {
            throw ConflictException("Cannot cancel an active auction. Contact support.")
        }

        if (auction.bidCount > 0 && !isAdmin) {
            throw ConflictException("Cannot cancel auction with existing bids. Contact support.")
        }

        auction.status = AuctionStatus.CANCELLED
        auction.item.status = ItemStatus.DRAFT
        auction.item.auctionId = null
        cacheManager.getCache("items")?.evict(auction.item.id!!)
    }

    /**
     * Admin-only force cancel: bypasses ACTIVE and bid-count guards.
     * The controller must enforce @PreAuthorize("hasRole('ADMIN')") before calling this.
     */
    @Transactional
    @CacheEvict(value = ["auctions"], key = "#id")
    fun adminForceCancelAuction(id: UUID, rejectionReason: String? = null) {
        val auction = findById(id)

        auction.status = AuctionStatus.CANCELLED
        auction.item.status = ItemStatus.REJECTED
        auction.item.auctionId = null
        auction.item.rejectionReason = rejectionReason
        cacheManager.getCache("items")?.evict(auction.item.id!!)

        logger.info("Admin force-cancelled auction ${auction.id}")
    }

    @Transactional
    @CacheEvict(value = ["auctions"], key = "#id")
    fun adminUpdateAuction(id: UUID, dto: com.oblapleon.bidapi.feature.auction.dto.UpdateAuctionDto): Auction {
        val auction = findById(id)

        if (auction.status != AuctionStatus.PENDING_APPROVAL) {
            throw ConflictException("Can only edit auctions that are pending approval.")
        }

        dto.startTime?.let { auction.startTime = it }
        dto.endTime?.let { auction.endTime = it }
        
        if (auction.endTime.isBefore(auction.startTime)) {
            throw BadRequestException("End time must be after start time.")
        }
        if (auction.endTime.isBefore(Instant.now())) {
            throw BadRequestException("End time must be in the future.")
        }

        dto.startPrice?.let { 
            auction.startPrice = it 
            auction.currentPrice = it // Reset currentPrice if startPrice changes while pending
        }
        
        dto.isNoReserve?.let { auction.isNoReserve = it }
        
        if (dto.reservePrice != null) {
            auction.reservePrice = dto.reservePrice
        } else if (dto.isNoReserve == true) {
            auction.reservePrice = null
        }

        dto.itemUpdates?.let { itemUpdates ->
            val item = auction.item
            itemUpdates.year?.let { item.year = it }
            itemUpdates.make?.let { item.make = it }
            itemUpdates.model?.let { item.model = it }
            itemUpdates.vin?.let { item.vin = it }
            itemUpdates.location?.let { item.location = it }
            itemUpdates.mileage?.let { item.mileage = it }
            itemUpdates.description?.let { item.description = it }
            itemUpdates.isModified?.let { item.isModified = it }
            itemUpdates.hasServiceHistory?.let { item.hasServiceHistory = it }
            itemUpdates.titleStatus?.let { item.titleStatus = it }
            itemUpdates.fuelType?.let { item.fuelType = it }
            itemUpdates.engine?.let { item.engine = it }
            itemUpdates.drivetrain?.let { item.drivetrain = it }
            itemUpdates.transmission?.let { item.transmission = it }
            itemUpdates.bodyStyle?.let { item.bodyStyle = it }
            itemUpdates.exteriorColor?.let { item.exteriorColor = it }
            itemUpdates.interiorColor?.let { item.interiorColor = it }
            itemUpdates.sellerType?.let { item.sellerType = it }
            itemUpdates.horsepower?.let { item.horsepower = it }
            itemUpdates.condition?.let { item.condition = it }
            itemUpdates.highlights?.let { item.highlights = it }
            itemUpdates.knownFlaws?.let { item.knownFlaws = it }
            itemUpdates.recentServiceHistory?.let { item.recentServiceHistory = it }
            itemUpdates.otherItemsIncluded?.let { item.otherItemsIncluded = it }
        }

        return auctionRepository.save(auction)
    }




}