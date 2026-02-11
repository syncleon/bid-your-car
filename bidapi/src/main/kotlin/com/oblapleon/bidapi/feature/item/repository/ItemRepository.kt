package com.oblapleon.bidapi.feature.item.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
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
     * Usage: Admin dashboard (PENDING_REVIEW), Public listings (AVAILABLE).
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
     * Finds items that are 'AVAILABLE' (approved by admin) but
     * haven't been attached to an Auction yet.
     * Useful for the "Create Auction" wizard.
     */
    @Query("SELECT i FROM Item i WHERE i.status = 'AVAILABLE' AND i.auctions IS EMPTY")
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
}