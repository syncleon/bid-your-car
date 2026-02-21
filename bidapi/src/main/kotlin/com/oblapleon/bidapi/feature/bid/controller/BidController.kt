package com.oblapleon.bidapi.feature.bid.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.bid.service.BidService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/bids")
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

    @Operation(summary = "Get Bid Details")
    @GetMapping("/{id}")
    fun getBidDetails(@PathVariable id: UUID): ResponseEntity<BidDto> {
        val bid = bidService.findById(id)
        return ResponseEntity.ok(bid.toDto())
    }
}