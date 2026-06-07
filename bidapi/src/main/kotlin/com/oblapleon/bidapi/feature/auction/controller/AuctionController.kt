package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.common.service.RateLimitingService
import com.oblapleon.bidapi.feature.auction.dto.AuctionDto
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
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
import java.util.UUID

@RestController
@RequestMapping("/api/v1/auctions")
@Tag(name = "Auctions", description = "Public auction browsing and management")
class AuctionController(
    private val auctionService: AuctionService,
    private val rateLimitingService: RateLimitingService,
    private val authorizationHelper: AuthorizationHelper
) {

    @Operation(summary = "Browse Auctions", description = "Public feed of active auctions.")
    @GetMapping
    fun getPublicAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @Parameter(description = "Filter type: 'ending_soon', 'just_listed'")
        @RequestParam(required = false) filter: String?,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val page = auctionService.findAuctionsByCriteria(status, filter, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    @Operation(summary = "Recently Sold Auctions", description = "Shows the most recent successful sales.")
    @GetMapping("/sold")
    fun getRecentlySold(
        @PageableDefault(size = 10) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val soldAuctions = auctionService.findSoldAuctionsRecentlyAdded(pageable)
        return ResponseEntity.ok(soldAuctions.map { it.toDto() })
    }

    @Operation(summary = "Get Auction Details")
    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): ResponseEntity<AuctionDto> {
        val auction = auctionService.findById(id)
        return ResponseEntity.ok(auction.toDto())
    }

    @Operation(summary = "Create Auction", description = "List an item for auction (Pending Approval).")
    @PostMapping
    fun createAuction(
        @Valid @RequestBody dto: CreateAuctionDto
    ): ResponseEntity<AuctionDto> {
        val auction = auctionService.createAuction(dto)
        return ResponseEntity.status(HttpStatus.CREATED).body(auction.toDto())
    }

    @Operation(summary = "Place Custom Bid", description = "Submit a specific bid amount on an active auction.")
    @PostMapping("/{id}/bids")
    fun placeBid(
        @PathVariable id: UUID,
        @Valid @RequestBody request: BidRequest
    ): ResponseEntity<Any> {
        val currentUser = authorizationHelper.getCurrentUser()

        val bucket = rateLimitingService.resolveBucket(currentUser.id!!)
        val probe = bucket.tryConsumeAndReturnRemaining(1)

        if (!probe.isConsumed) {
            val waitForSeconds = probe.nanosToWaitForRefill / 1_000_000_000
            return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-Rate-Limit-Retry-After-Seconds", waitForSeconds.toString())
                .body(mapOf("error" to "You are bidding too fast! Please wait $waitForSeconds seconds."))
        }
        val bid = auctionService.placeBid(id, request.amount)
        return ResponseEntity.status(HttpStatus.CREATED).body(bid.toDto())
    }

    @Operation(summary = "Quick Bid", description = "Automatically places the next minimum required bid.")
    @PostMapping("/{id}/bids/quick")
    fun placeQuickBid(
        @PathVariable id: UUID
    ): ResponseEntity<Any> {
        val currentUser = authorizationHelper.getCurrentUser()
        val bucket = rateLimitingService.resolveBucket(currentUser.id!!)
        val probe = bucket.tryConsumeAndReturnRemaining(1)

        if (!probe.isConsumed) {
            val waitForSeconds = probe.nanosToWaitForRefill / 1_000_000_000
            return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-Rate-Limit-Retry-After-Seconds", waitForSeconds.toString())
                .body(mapOf("error" to "You are bidding too fast! Please wait $waitForSeconds seconds."))
        }

        val bid = auctionService.placeNextMinimumBid(id)
        return ResponseEntity.status(HttpStatus.CREATED).body(bid.toDto())
    }

    @Operation(summary = "Cancel Auction", description = "Cancel a listing. Restricted if bids exist.")
    @DeleteMapping("/{id}")
    fun cancelAuction(
        @PathVariable id: UUID
    ): ResponseEntity<Map<String, String>> {
        // Service internally verifies if the user is the owner or an Admin
        auctionService.cancelAuction(id)
        return ResponseEntity.ok(mapOf("message" to "Auction cancelled successfully"))
    }

    @Operation(summary = "My Wins", description = "Auctions won by the current user.")
    @GetMapping("/me/wins")
    fun getMyWins(
        @PageableDefault(size = 20, sort = ["endTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val page = auctionService.findWonByUser(currentUser.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    @Operation(summary = "My Listings", description = "Auctions created by the current user.")
    @GetMapping("/me/listings")
    fun getMyListings(
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<AuctionDto>> {
        val currentUser = authorizationHelper.getCurrentUser()
        val page = auctionService.findBySeller(currentUser.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    @Operation(summary = "Approve Auction", description = "Admin: Activate a pending auction.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approve")
    fun approveAuction(@PathVariable id: UUID): ResponseEntity<Map<String, String>> {
        auctionService.approveAuction(id)
        return ResponseEntity.ok(mapOf("message" to "Auction approved successfully."))
    }

    @Operation(summary = "Force Cancel", description = "Admin: Cancel an auction even if active or if bids exist.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}/cancel")
    fun adminCancelAuction(
        @PathVariable id: UUID
    ): ResponseEntity<Map<String, String>> {
        auctionService.adminForceCancelAuction(id)
        return ResponseEntity.ok(mapOf("message" to "Auction force-cancelled by admin."))
    }
}