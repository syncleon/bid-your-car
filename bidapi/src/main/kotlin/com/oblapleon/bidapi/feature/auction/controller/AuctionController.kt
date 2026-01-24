package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/auctions")
class AuctionController(
    private val auctionService: AuctionService,
    private val authHelper: AuthorizationHelper
) : BaseController() {

    @PostMapping
    fun createAuction(@Valid @RequestBody dto: CreateAuctionDto): ResponseEntity<Any> = handleRequest {
        val currentUser = authHelper.getCurrentUser()
        val durationHours = java.time.Duration.between(java.time.Instant.now(), dto.endTime).toHours()

        auctionService.createAuction(
            itemId = dto.itemId,
            startPrice = dto.startingBid,
            durationHours = durationHours,
            reservePrice = dto.reservePrice,
            sellerId = currentUser.id!!
        ).toDto()
    }

    @GetMapping
    fun getAllAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @RequestParam(required = false) sellerId: Long?
    ): ResponseEntity<Any> = handleRequest {
        when {
            sellerId != null -> auctionService.getAuctionsBySeller(sellerId).map { it.toDto() }
            status != null -> auctionService.findAuctionsByStatus(status).map { it.toDto() }
            else -> auctionService.findAll().map { it.toDto() }
        }
    }

    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): ResponseEntity<Any> = handleRequest {
        auctionService.findById(id).toDto()
    }

    @GetMapping("/ending-soon")
    fun getEndingSoon(@RequestParam(defaultValue = "10") limit: Int): ResponseEntity<Any> = handleRequest {
        auctionService.getEndingSoon(limit).map { it.toDto() }
    }

    @PostMapping("/{id}/bid")
    fun placeBid(
        @PathVariable id: UUID,
        @RequestParam amount: java.math.BigDecimal
    ): ResponseEntity<Any> = handleRequest {
        val currentUser = authHelper.getCurrentUser()
        auctionService.placeBid(id, currentUser.id!!, amount).toDto()
    }

    @DeleteMapping("/{id}")
    fun cancelAuction(@PathVariable id: UUID): ResponseEntity<Any> = handleRequest {
        val auction = auctionService.findById(id)
        authHelper.checkOwnerOrAdmin(auction.item.seller.id!!)

        auctionService.delete(id)
        mapOf("message" to "Auction cancelled successfully")
    }
    
    @GetMapping("/my-wins")
    fun getMyWins(): ResponseEntity<Any> = handleRequest {
        val currentUser = authHelper.getCurrentUser()
        auctionService.getAuctionsWonByUser(currentUser.id!!).map { it.toDto() }
    }

}