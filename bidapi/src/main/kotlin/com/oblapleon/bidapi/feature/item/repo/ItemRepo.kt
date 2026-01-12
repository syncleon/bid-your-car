package com.oblapleon.bidapi.feature.item.repo

import com.oblapleon.bidapi.feature.item.entity.Item
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@Repository
interface ItemRepo : JpaRepository<Item, UUID> {

    @Query("SELECT i FROM Item i WHERE i.seller.deletedAt IS NULL")
    fun findAllActive(): List<Item>

    fun findBySellerId(sellerId: Long): List<Item>
    fun existsByVin(vin: String): Boolean
}