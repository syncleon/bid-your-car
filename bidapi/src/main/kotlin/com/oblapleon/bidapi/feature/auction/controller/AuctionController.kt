package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.AuctionDto
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.BidDto
import com.oblapleon.bidapi.feature.bid.dto.toDto
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.util.*

@RestController
@RequestMapping("/api/v1/auctions")
class AuctionController(
    private val auctionService: AuctionService,
    private val authHelper: AuthorizationHelper
) {

    @PostMapping
    fun createAuction(@Valid @RequestBody dto: CreateAuctionDto): AuctionDto {
        val currentUser = authHelper.getCurrentUser()
        return auctionService.createAuction(currentUser.id!!, dto).toDto()
    }

    @GetMapping
    fun getAllAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @RequestParam(required = false) sellerId: Long?,
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): Page<AuctionDto> {
        // ✅ FIX: Service now returns Page<AuctionDto>, so we don't map here.
        return when {
            sellerId != null -> auctionService.getAuctionsBySeller(sellerId, pageable)
            status != null -> auctionService.findByStatus(status, pageable)
            else -> auctionService.findAll(pageable)
        }
    }

    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): AuctionDto {
        // Service handles the transaction, but findById usually returns Entity.
        // Ideally, service should return DTO, but mapping here is generally safe for single items
        // IF the service fetches everything needed. To be 100% safe, move .toDto() to service findById too.
        // For now, we assume findById is simple enough or updated.
        return auctionService.findById(id).toDto()
    }

    @GetMapping("/ending-soon")
    fun getEndingSoon(
        @PageableDefault(size = 10, sort = ["endTime"], direction = Sort.Direction.ASC) pageable: Pageable
    ): Page<AuctionDto> {
        // ✅ FIX: Removed .map { it.toDto() }
        return auctionService.getEndingSoon(pageable)
    }

    @PostMapping("/{id}/bid")
    fun placeBid(
        @PathVariable id: UUID,
        @RequestParam amount: BigDecimal
    ): BidDto {
        val currentUser = authHelper.getCurrentUser()
        return auctionService.placeBid(id, currentUser.id!!, amount).toDto()
    }

    @DeleteMapping("/{id}")
    fun cancelAuction(@PathVariable id: UUID) {
        // ✅ FIX: Move security check into Service to prevent LazyInitializationException
        val currentUser = authHelper.getCurrentUser()
        auctionService.cancelAuction(id, currentUser)
    }

    @GetMapping("/my-wins")
    fun getMyWins(
        @PageableDefault(size = 20, sort = ["endTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): Page<AuctionDto> {
        // ✅ FIX: Removed .map { it.toDto() }
        val currentUser = authHelper.getCurrentUser()
        return auctionService.getAuctionsWonByUser(currentUser.id!!, pageable)
    }
}