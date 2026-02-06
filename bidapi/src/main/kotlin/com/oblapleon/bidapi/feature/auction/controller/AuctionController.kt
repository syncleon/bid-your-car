package com.oblapleon.bidapi.feature.auction.controller

import com.oblapleon.bidapi.common.controller.BaseController
import com.oblapleon.bidapi.common.helpers.AuthorizationHelper
import com.oblapleon.bidapi.feature.auction.dto.AuctionDto
import com.oblapleon.bidapi.feature.auction.dto.CreateAuctionDto
import com.oblapleon.bidapi.feature.auction.dto.toDto
import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.service.AuctionService
import com.oblapleon.bidapi.feature.bid.dto.toDto
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

    @PostMapping
    fun createAuction(@Valid @RequestBody dto: CreateAuctionDto): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            auctionService.createAuction(currentUser.id!!, dto).toDto()
        }
    }

    @GetMapping
    fun getAllAuctions(
        @RequestParam(required = false) status: AuctionStatus?,
        @RequestParam(required = false) sellerId: Long?,
        @PageableDefault(size = 20, sort = ["startTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            when {
                sellerId != null -> auctionService.getAuctionsBySeller(sellerId, pageable)
                status != null -> auctionService.findByStatus(status, pageable)
                else -> auctionService.findAll(pageable)
            }
        }
    }

    @GetMapping("/{id}")
    fun getAuctionById(@PathVariable id: UUID): ResponseEntity<Any> {
        return handleRequest {
            auctionService.findById(id).toDto()
        }
    }

    @GetMapping("/ending-soon")
    fun getEndingSoon(
        @PageableDefault(size = 10, sort = ["endTime"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            auctionService.getEndingSoon(pageable)
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

    @GetMapping("/my-wins")
    fun getMyWins(
        @PageableDefault(size = 20, sort = ["endTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<Any> {
        return handleRequest {
            val currentUser = authHelper.getCurrentUser()
            auctionService.getAuctionsWonByUser(currentUser.id!!, pageable)
        }
    }
}