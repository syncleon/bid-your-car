package com.oblapleon.bidapi.feature.item.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.item.entity.ConditionGrade
import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemRepository : BaseRepository<Item, UUID> {

    /**
     * Finds items by their lifecycle status.
     * Usage: Admin dashboard (PENDING_AUCTION), Public listings (ACTIVE_AUCTION).
     */
    fun findAllByStatus(status: ItemStatus, pageable: Pageable): Page<Item>

    /**
     * Seller Dashboard: View all items regardless of status.
     */
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item>

    /**
     * Seller Dashboard: Filtered view (e.g., "My Sold Items").
     */
    fun findAllBySellerIdAndStatus(sellerId: Long, status: ItemStatus, pageable: Pageable): Page<Item>

    /**
     * Used during item creation to warn if this car was listed previously.
     */
    fun existsByVin(vin: String): Boolean

    /**
     * Finds items that are 'PENDING_AUCTION' (submitted by seller) but
     * haven't been attached to an active Auction yet.
     * Useful for the Admin "Create/Approve Auction" wizard.
     */
    @Query("SELECT i FROM Item i WHERE i.status = 'PENDING_AUCTION' AND i.auctions IS EMPTY")
    fun findReadyForAuction(pageable: Pageable): Page<Item>

    /**
     * Native Query for high-performance Autocomplete (e.g., "Ford Mus...").
     * Returns distinct models for a specific make.
     */
    @Query(
        value = "SELECT DISTINCT model FROM items WHERE make = :make AND model LIKE :query% LIMIT 10",
        nativeQuery = true
    )
    fun searchModels(@Param("make") make: String, @Param("query") query: String): List<String>

    /**
     * Count used for User Profile stats (e.g. "Sold 50 cars").
     */
    fun countBySellerIdAndStatus(sellerId: Long, status: ItemStatus): Long

    // --- Filtering Methods ---

    /**
     * Filter by condition (e.g., "Show me only EXCELLENT cars").
     */
    fun findAllByConditionAndStatus(condition: ConditionGrade, status: ItemStatus, pageable: Pageable): Page<Item>

    /**
     * Filter by fuel type (e.g., "Show me Electric cars").
     */
    fun findAllByFuelTypeAndStatus(fuelType: String, status: ItemStatus, pageable: Pageable): Page<Item>

    /**
     * Find exciting "No Reserve" listings that are active or upcoming.
     */
    fun findAllByIsNoReserveTrueAndStatusIn(statuses: List<ItemStatus>, pageable: Pageable): Page<Item>
}