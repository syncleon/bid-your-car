package com.oblapleon.bidapi.feature.bid.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.bid.service.BidQueryService
import com.oblapleon.bidapi.feature.user.entity.ERole
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import com.oblapleon.bidapi.common.config.ApiConstants
import java.util.UUID


@RestController
@RequestMapping(ApiConstants.BIDS)
@Tag(name = "Bids", description = "Bid history and user activity")
class BidController(
    private val bidQueryService: BidQueryService,
    private val authorizationHelper: AuthorizationHelper
) {

    /**
     * Retrieves the bidding history for a specific auction.
     *
     * @param auctionId The UUID of the auction.
     * @param pageable Pagination and sorting criteria.
     * @return A paginated list of [BidDto].
     */
    @Operation(summary = "Get Auction History", description = "List all bids for a specific auction.")
    @GetMapping("/auction/{auctionId}")
    fun getAuctionHistory(
        @PathVariable auctionId: UUID,
        @PageableDefault(size = 20, sort = ["amount"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<BidDto>> {
        val page = bidQueryService.findHistoryByAuctionId(auctionId, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    /**
     * Retrieves the bidding history for the currently authenticated user.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A paginated list of [BidDto] representing the user's bids.
     */
    @Operation(summary = "Get My Bids", description = "List all bids placed by the current user.")
    @GetMapping("/me")
    fun getMyBidHistory(
        @PageableDefault(size = 20, sort = ["bidTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<BidDto>> {
        val user = authorizationHelper.getCurrentUser()
        val page = bidQueryService.findHistoryByUserId(user.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    /**
     * Retrieves detailed information about a specific bid.
     * Access is restricted to the user who placed the bid or an admin.
     *
     * @param id The UUID of the bid.
     * @return The [BidDto] containing bid details.
     */
    @Operation(summary = "Get Bid Details", description = "Returns details of a specific bid. Only accessible by the bidder or an Admin.")
    @GetMapping("/{id}")
    fun getBidDetails(@PathVariable id: UUID): ResponseEntity<BidDto> {
        val bid = bidQueryService.findById(id)
        val currentUser = authorizationHelper.getCurrentUser()
        val isOwner = bid.bidder.id == currentUser.id
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }
        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
        return ResponseEntity.ok(bid.toDto())
    }
}