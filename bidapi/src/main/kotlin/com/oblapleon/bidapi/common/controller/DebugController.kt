package com.oblapleon.bidapi.common.controller

import com.oblapleon.bidapi.common.service.AuctionSeederService
import com.oblapleon.bidapi.common.service.BidSeederService
import com.oblapleon.bidapi.common.service.ItemSeederService
import com.oblapleon.bidapi.common.service.SeedingCleanupService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.context.annotation.Profile
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/debug")
@Tag(name = "Debug Tools", description = "Endpoints for testing and seeding data")
@Profile("!prod")
class DebugController(
    private val itemSeederService: ItemSeederService,
    private val auctionSeederService: AuctionSeederService,
    private val bidSeederService: BidSeederService,
    private val seedingCleanupService: SeedingCleanupService
) {

    /**
     * Clears all items, auctions, and bids from the database.
     * 
     * @return A response entity containing a success or error message.
     */
    @Operation(summary = "Clear all items, auctions, and bids")
    @PostMapping("/clear-all")
    fun clearAll(): ResponseEntity<Any> {
        return try {
            seedingCleanupService.clearAllData()
            ResponseEntity.ok(mapOf("message" to "Successfully cleared all bids, auctions, and items"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    /**
     * Resets the database and seeds it with real car auctions.
     * 
     * @param count The number of auctions to generate.
     * @return A response entity containing a success or error message.
     */
    @Operation(summary = "Reset database and generate real car auctions")
    @PostMapping("/reset-and-seed")
    fun resetAndSeed(@RequestParam(defaultValue = "100") count: Int): ResponseEntity<Any> {
        return try {
            seedingCleanupService.clearAllData()
            itemSeederService.seedItems(count)
            auctionSeederService.seedAuctions(count)
            ResponseEntity.ok(mapOf("message" to "Successfully reset database and seeded $count real car auctions"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    /**
     * Seeds the database with random real cars.
     * 
     * @param count The number of items to generate.
     * @return A response entity containing a success or error message.
     */
    @Operation(summary = "Generate random real cars")
    @PostMapping("/seed-items")
    fun seedItems(@RequestParam(defaultValue = "100") count: Int): ResponseEntity<Any> {
        return try {
            itemSeederService.seedItems(count)
            ResponseEntity.ok(mapOf("message" to "Successfully generated $count items"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }

    /**
     * Generates auctions for existing items.
     * 
     * @param count The number of items to generate auctions for.
     * @return A response entity containing a success or error message.
     */
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

    /**
     * Places random bids in parallel on active auctions.
     * 
     * @param count The total number of bids to place.
     * @param concurrency The maximum concurrency level for placing bids.
     * @return A response entity containing a success or error message.
     */
    @Operation(summary = "Place random bids in PARALLEL on ACTIVE auctions")
    @PostMapping("/seed-bids")
    fun seedBids(
        @RequestParam(defaultValue = "100") count: Int,
        @RequestParam(defaultValue = "10") concurrency: Int
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