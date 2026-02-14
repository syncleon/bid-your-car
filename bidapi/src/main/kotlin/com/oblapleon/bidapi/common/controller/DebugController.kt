package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.service.AuctionSeederService
import com.oblapleon.bidapi.common.service.BidSeederService
import com.oblapleon.bidapi.common.service.ItemSeederService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize // ✅ Import this
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/debug")
@Tag(name = "Debug Tools", description = "Endpoints for testing and seeding data")
// ✅ Authorization Rule: Lock this entire controller to Admins only
@PreAuthorize("hasRole('ADMIN')")
class DebugController(
    private val itemSeederService: ItemSeederService,
    private val auctionSeederService: AuctionSeederService,
    private val bidSeederService: BidSeederService
) {

    @Operation(summary = "Generate random cars")
    @PostMapping("/seed-items")
    fun seedItems(@RequestParam(defaultValue = "100") count: Int): ResponseEntity<Any> {
        itemSeederService.seedItems(count)
        return ResponseEntity.ok(mapOf("message" to "Successfully generated $count items"))
    }

    @Operation(summary = "Generate auctions for existing items")
    @PostMapping("/seed-auctions")
    fun seedAuctions(@RequestParam(defaultValue = "50") count: Int): ResponseEntity<Any> {
        try {
            auctionSeederService.seedAuctions(count)
            return ResponseEntity.ok(mapOf("message" to "Successfully generated auctions for $count items"))
        } catch (e: Exception) {
            return ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    @Operation(summary = "Place random bids in PARALLEL on ACTIVE auctions")
    @PostMapping("/seed-bids")
    fun seedBids(
        @RequestParam(defaultValue = "100") count: Int,
        @RequestParam(defaultValue = "10") concurrency: Int // ✅ New parameter
    ): ResponseEntity<Any> {
        return try {
            bidSeederService.seedLiveBidsParallel(count, concurrency)
            ResponseEntity.ok(mapOf(
                "message" to "Parallel seeding complete",
                "totalAttempted" to count,
                "maxConcurrency" to concurrency
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }
}