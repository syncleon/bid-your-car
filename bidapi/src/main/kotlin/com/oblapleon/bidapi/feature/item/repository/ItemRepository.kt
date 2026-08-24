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

import org.springframework.data.jpa.repository.EntityGraph

@Repository
interface ItemRepository : BaseRepository<Item, UUID> {

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllByStatus(status: ItemStatus, pageable: Pageable): Page<Item>

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllBySellerId(sellerId: Long, pageable: Pageable): Page<Item>

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllBySellerIdAndStatus(sellerId: Long, status: ItemStatus, pageable: Pageable): Page<Item>
    fun existsByVin(vin: String): Boolean

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    @Query("SELECT i FROM Item i WHERE i.status = 'DRAFT' AND i.auctions IS EMPTY")
    fun findReadyForAuction(pageable: Pageable): Page<Item>

    @Query(
        value = "SELECT DISTINCT model FROM items WHERE make = :make AND model LIKE :query% LIMIT 10",
        nativeQuery = true
    )
    fun searchModels(@Param("make") make: String, @Param("query") query: String): List<String>
    fun countBySellerIdAndStatus(sellerId: Long, status: ItemStatus): Long

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllByConditionAndStatus(condition: ConditionGrade, status: ItemStatus, pageable: Pageable): Page<Item>

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllByFuelTypeAndStatus(fuelType: String, status: ItemStatus, pageable: Pageable): Page<Item>

    @EntityGraph(attributePaths = ["seller", "images", "auctions"])
    fun findAllByIsNoReserveTrueAndStatusIn(statuses: List<ItemStatus>, pageable: Pageable): Page<Item>
}