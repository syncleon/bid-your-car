package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.service.RateLimitingService
import com.oblapleon.bidapi.feature.auction.dto.AuctionDto
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.user.entity.ERole
import com.oblapleon.bidapi.feature.bid.dto.BidRequest
import com.oblapleon.bidapi.feature.bid.dto.toDto
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@RestController
@RequestMapping("/api/v1/auctions")
@Tag(name = "Auctions", description = "Public auction browsing and management")
class AuctionController(
    private val auctionService: AuctionService,
    private val bidQueueProducer: com.oblapleon.bidapi.feature.bid.service.BidQueueProducer,
    private val rateLimitingService: RateLimitingService,
    private val authorizationHelper: AuthorizationHelper
) {

    /**
     * Retrieves a paginated list of active auctions available to the public.
     * Allows filtering by status and sorting logic (e.g., ending soon).
     *
     * @param status Optional filter by [AuctionStatus].
     * @param filter Optional pre-defined sorting/filtering strategy.
     * @param pageable Pagination configuration.
     * @return A paginated list of [AuctionDto].
     */
    @Operation(summary = "Browse Auctions", description = "Public feed of active auctions.")
    @GetMapping
    @Transactional(readOnly = true)
    fun getPublicAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @Parameter(description = "Filter type: 'ending_soon', 'just_listed'")
        @RequestParam(required = false) filter: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val page = auctionService.findAuctionsByCriteria(status, filter, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    /**
     * Retrieves a paginated list of recently sold auctions.
     *
     * @param pageable Pagination configuration.
     * @return A paginated list of [AuctionDto].
     */
    @Operation(summary = "Recently Sold Auctions", description = "Shows the most recent successful sales.")
    @GetMapping("/sold")
    fun getRecentlySold(
        @PageableDefault(size = 10) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val soldAuctions = auctionService.findSoldAuctionsRecentlyAdded(pageable)
        return ResponseEntity.ok(soldAuctions.map { it.toDto() })
    }

    /**
     * Retrieves the details of a specific auction.
     * Results are cached to optimize reads.
     *
     * @param id The UUID of the auction.
     * @return The [AuctionDto] detailing the auction.
     */
    @Operation(summary = "Get Auction", description = "Get details of a specific auction.")
    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): ResponseEntity<AuctionDto> {
        return ResponseEntity.ok(auctionService.getAuctionDtoById(id))
    }

    /**
     * Submits a request to create a new auction for an item.
     * The new auction is placed in PENDING_APPROVAL status.
     *
     * @param dto The auction configuration parameters.
     * @return The created [AuctionDto].
     */
    @Operation(summary = "Create Auction", description = "List an item for auction (Pending Approval).")
    @PostMapping
    fun createAuction(
        @Valid @RequestBody dto: CreateAuctionDto
    ): ResponseEntity<AuctionDto> {
        val currentUser = authorizationHelper.getCurrentUser()
        val auction = auctionService.createAuction(dto, currentUser.id!!)
        return ResponseEntity.status(HttpStatus.CREATED).body(auction.toDto())
    }

    /**
     * Places a specific maximum bid on an active auction.
     * Subject to rate limiting to prevent spam.
     *
     * @param id The UUID of the auction.
     * @param request The bid amount requested.
     * @return The outcome of the bid (which might be immediately outbid due to proxy bidding).
     */
    @Operation(summary = "Place Custom Bid", description = "Submit a specific bid amount on an active auction.")
    @PostMapping("/{id}/bids")
    fun placeBid(
        @PathVariable id: UUID,
        @Valid @RequestBody request: BidRequest
    ): ResponseEntity<Any> {
        val currentUser = authorizationHelper.getCurrentUser()
        bidQueueProducer.enqueueBid(id, currentUser.id!!, request.amount)
        return ResponseEntity.accepted().build()
    }

    /**
     * Submits a bid at the exact minimum required amount.
     * Subject to rate limiting.
     *
     * @param id The UUID of the auction.
     * @return The outcome of the quick bid.
     */
    @Operation(summary = "Quick Bid", description = "Automatically places the next minimum required bid.")
    @PostMapping("/{id}/bids/quick")
    fun placeQuickBid(
        @PathVariable id: UUID
    ): ResponseEntity<Any> {
        val currentUser = authorizationHelper.getCurrentUser()
        bidQueueProducer.enqueueQuickBid(id, currentUser.id!!)
        return ResponseEntity.accepted().build()
    }

    /**
     * Cancels an auction, provided it has no bids or is not already active
     * (unless performed by an admin).
     *
     * @param id The UUID of the auction.
     * @return A success message.
     */
    @Operation(summary = "Cancel Auction", description = "Cancel a listing. Restricted if bids exist.")
    @DeleteMapping("/{id}")
    fun cancelAuction(
        @PathVariable id: UUID
    ): ResponseEntity<Map<String, String>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }
        auctionService.cancelAuction(id, currentUser.id!!, isAdmin)
        return ResponseEntity.ok(mapOf("message" to "Auction cancelled successfully"))
    }

    /**
     * Retrieves all auctions that the current user has successfully won.
     *
     * @param pageable Pagination configuration.
     * @return A paginated list of [AuctionDto].
     */
    @Operation(summary = "My Wins", description = "Auctions won by the current user.")
    @GetMapping("/me/wins")
    fun getMyWins(
        @PageableDefault(size = 20, sort = ["endTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val page = auctionService.findWonByUser(currentUser.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    /**
     * Retrieves all auctions listed by the current user.
     *
     * @param pageable Pagination configuration.
     * @return A paginated list of [AuctionDto].
     */
    @Operation(summary = "My Listings", description = "Auctions created by the current user.")
    @GetMapping("/me/listings")
    fun getMyListings(
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val page = auctionService.findBySeller(currentUser.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    /**
     * Admin action to approve a pending auction and make it ACTIVE or SCHEDULED.
     *
     * @param id The UUID of the auction.
     * @return A success message.
     */
    @Operation(summary = "Approve Auction", description = "Admin: Activate a pending auction.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approve")
    fun approveAuction(@PathVariable id: UUID): ResponseEntity<Map<String, String>> {
        auctionService.approveAuction(id)
        return ResponseEntity.ok(mapOf("message" to "Auction approved successfully."))
    }

    /**
     * Admin action to forcefully cancel an auction regardless of its current state or bid count.
     *
     * @param id The UUID of the auction.
     * @return A success message.
     */
    @Operation(summary = "Force Cancel", description = "Admin: Cancel an auction even if active or if bids exist.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}/cancel")
    fun adminCancelAuction(
        @PathVariable id: UUID,
        @RequestParam(required = false) rejectionReason: String?
    ): ResponseEntity<Map<String, String>> {
        auctionService.adminForceCancelAuction(id, rejectionReason)
        return ResponseEntity.ok(mapOf("message" to "Auction force-cancelled by admin."))
    }

    /**
     * Admin action to update a pending auction before approval.
     *
     * @param id The UUID of the auction.
     * @param dto The updated auction details.
     * @return The updated [AuctionDto].
     */
    @Operation(summary = "Admin Update Auction", description = "Admin: Edit a submitted auction before approval.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/{id}")
    fun adminUpdateAuction(
        @PathVariable id: UUID,
        @Valid @RequestBody dto: com.oblapleon.bidapi.feature.auction.dto.UpdateAuctionDto
    ): ResponseEntity<AuctionDto> {
        val updatedAuction = auctionService.adminUpdateAuction(id, dto)
        return ResponseEntity.ok(updatedAuction.toDto())
    }

    /**
     * Retrieves a paginated list of all auctions for admins.
     * Unlike the public endpoint, this does not default to ACTIVE.
     *
     * @param status Optional filter by [AuctionStatus].
     * @param pageable Pagination configuration.
     * @return A paginated list of [AuctionDto].
     */
    @Operation(summary = "Admin Browse Auctions", description = "Admin: View all auctions regardless of status.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    @Transactional(readOnly = true)
    fun getAdminAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val page = auctionService.findAdminAuctionsByCriteria(status, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }
}