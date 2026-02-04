package com.oblapleon.bidapi.feature.bid.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.PlaceBidReq
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.bid.service.BidService
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/bids")
class BidController(
    private val bidService: BidService,
    private val auctionService: AuctionService,
    private val authHelper: AuthorizationHelper
) {

    @PostMapping
    fun placeBid(@Valid @RequestBody req: PlaceBidReq): BidDto {
        val currentUser = authHelper.getCurrentUser()

        // logic for placing a bid lives in AuctionService to maintain transaction integrity
        return auctionService.placeBid(
            auctionId = req.auctionId,
            bidderId = currentUser.id!!,
            amount = req.amount
        ).toDto()
    }

    @GetMapping("/auction/{auctionId}")
    fun getAuctionHistory(
        @PathVariable auctionId: UUID,
        @PageableDefault(size = 20, sort = ["bidTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): Page<BidDto> {
        return bidService.getBidHistoryForAuction(auctionId, pageable).map { it.toDto() }
    }

    @GetMapping("/my-bids")
    fun getMyBidHistory(
        @PageableDefault(size = 20, sort = ["bidTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): Page<BidDto> {
        val currentUser = authHelper.getCurrentUser()
        return bidService.getBidsByUser(currentUser.id!!, pageable).map { it.toDto() }
    }

    @GetMapping("/{id}")
    fun getBidDetails(@PathVariable id: UUID): BidDto {
        return bidService.findById(id).toDto()
    }
}