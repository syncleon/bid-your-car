package com.oblapleon.bidapi.feature.bid.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.PlaceBidReq
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.bid.dto.toRespList
import com.oblapleon.bidapi.feature.bid.service.BidService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/bids")
class BidController(
    private val bidService: BidService,
    private val auctionService: AuctionService, // Needed to trigger the placement logic
    private val authHelper: AuthorizationHelper
) : BaseController() {

    @PostMapping
    fun placeBid(@Valid @RequestBody req: PlaceBidReq): ResponseEntity<Any> = handleRequest {
        val currentUser = authHelper.getCurrentUser()

        auctionService.placeBid(
            auctionId = req.auctionId,
            bidderId = currentUser.id!!,
            amount = req.amount
        ).toDto()
    }

    @GetMapping("/auction/{auctionId}")
    fun getAuctionHistory(@PathVariable auctionId: UUID): ResponseEntity<Any> = handleRequest {
        bidService.getBidHistoryForAuction(auctionId).toRespList()
    }

    @GetMapping("/my-bids")
    fun getMyBidHistory(): ResponseEntity<Any> = handleRequest {
        val currentUser = authHelper.getCurrentUser()
        bidService.getBidsByUser(currentUser.id!!).toRespList()
    }

    @GetMapping("/{id}")
    fun getBidDetails(@PathVariable id: UUID): ResponseEntity<Any> = handleRequest {
        bidService.findById(id).toDto()
    }
}