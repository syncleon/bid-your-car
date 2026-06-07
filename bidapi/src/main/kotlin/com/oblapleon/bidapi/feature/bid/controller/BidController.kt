package com.oblapleon.bidapi.feature.bid.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.bid.service.BidService
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
    private val bidService: BidService,
    private val authorizationHelper: AuthorizationHelper
) {

    @Operation(summary = "Get Auction History", description = "List all bids for a specific auction.")
    @GetMapping("/auction/{auctionId}")
    fun getAuctionHistory(
        @PathVariable auctionId: UUID,
        @PageableDefault(size = 20, sort = ["amount"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<BidDto>> {
        val page = bidService.findHistoryByAuctionId(auctionId, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    @Operation(summary = "Get My Bids", description = "List all bids placed by the current user.")
    @GetMapping("/me")
    fun getMyBidHistory(
        @PageableDefault(size = 20, sort = ["bidTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Page<BidDto>> {
        val user = authorizationHelper.getCurrentUser()
        val page = bidService.findHistoryByUserId(user.id!!, pageable)
        return ResponseEntity.ok(page.map { it.toDto() })
    }

    @Operation(summary = "Get Bid Details", description = "Returns details of a specific bid. Only accessible by the bidder or an Admin.")
    @GetMapping("/{id}")
    fun getBidDetails(@PathVariable id: UUID): ResponseEntity<BidDto> {
        val bid = bidService.findById(id)
        val currentUser = authorizationHelper.getCurrentUser()
        val isOwner = bid.bidder.id == currentUser.id
        val isAdmin = currentUser.roles.any { it.name == ERole.ADMIN }
        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build()
        }
        return ResponseEntity.ok(bid.toDto())
    }
}