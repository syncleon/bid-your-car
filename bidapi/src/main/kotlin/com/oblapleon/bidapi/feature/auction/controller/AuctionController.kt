package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.exceptions.UnauthorizedException
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.toDto
import com.oblapleon.bidapi.feature.user.entity.ERole
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.util.*

@RestController
@RequestMapping("/api/v1/auctions")
class AuctionController(
    private val auctionService: AuctionService,
    private val authHelper: AuthorizationHelper
) : BaseController() {

    // --- PUBLIC / SELLER ENDPOINTS ---

    @PostMapping
    fun createAuction(@Valid @RequestBody dto: CreateAuctionDto): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            // Returns the auction, status will be PENDING_APPROVAL
            auctionService.createAuction(currentUser.id!!, dto).toDto()
        }
    }

    @GetMapping
    fun getPublicAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @RequestParam(required = false) sellerId: Long?,
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            // By default, this now filters out PENDING/REJECTED unless specifically asked AND logic permits
            auctionService.findPublicAuctions(status, sellerId, pageable)
        }
    }

    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): ResponseEntity<Any> {
        return handleRequest {
            auctionService.findById(id).toDto()
        }
    }

    @PostMapping("/{id}/bid")
    fun placeBid(
        @PathVariable id: UUID,
        @RequestParam amount: BigDecimal
    ): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            auctionService.placeBid(id, currentUser.id!!, amount).toDto()
        }
    }

    @DeleteMapping("/{id}")
    fun cancelAuction(@PathVariable id: UUID): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            auctionService.cancelAuction(id, currentUser)
            mapOf("message" to "Auction cancelled successfully")
        }
    }

    // --- QUERY HELPERS ---

    @GetMapping("/ending-soon")
    fun getEndingSoon(
        @PageableDefault(size = 10, sort = ["endTime"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<Any> = handleRequest { auctionService.getEndingSoon(pageable) }

    @GetMapping("/my-wins")
    fun getMyWins(
        @PageableDefault(size = 20, sort = ["endTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Any> = handleRequest {
        auctionService.getAuctionsWonByUser(authHelper.getCurrentUser().id!!, pageable)
    }

    @GetMapping("/{id}/winner")
    fun getAuctionWinner(@PathVariable id: UUID): ResponseEntity<Any> = handleRequest {
        auctionService.getWinningBid(id)?.toDto()
            ?: mapOf("message" to "No winner determined yet")
    }

    // --- ADMIN ONLY ENDPOINTS ---

    @GetMapping("/admin/pending")
    fun getPendingAuctions(
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            requireAdmin()
            auctionService.findPendingAuctions(pageable)
        }
    }

    @PatchMapping("/{id}/approve")
    fun approveAuction(@PathVariable id: UUID): ResponseEntity<Any> {
        return handleRequest {
            requireAdmin()
            auctionService.approveAuction(id)
            mapOf("message" to "Auction approved. Start time reset to NOW.")
        }
    }

    @PatchMapping("/{id}/reject")
    fun rejectAuction(@PathVariable id: UUID): ResponseEntity<Any> {
        return handleRequest {
            requireAdmin()
            auctionService.rejectAuction(id)
            mapOf("message" to "Auction rejected.")
        }
    }

    // Helper to keep code DRY
    private fun requireAdmin() {
        val currentUser = authHelper.getCurrentUser()
        if (currentUser.roles.none { it.name == ERole.ADMIN }) {
            throw UnauthorizedException("Access Denied: Administrators only.")
        }
    }
}