package com.oblapleon.bidapi.feature.item.repo

import com.oblapleon.bidapi.feature.item.entity.Item
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@Repository
interface ItemRepo : JpaRepository<Item, UUID> {

    fun findBySellerId(sellerId: Long): List<Item>
    fun findByMakeIgnoreCaseAndModelIgnoreCase(make: String, model: String): List<Item>
    fun findByLocationContainingIgnoreCase(location: String): List<Item>
    fun findByBuyNowPriceBetween(minPrice: BigDecimal, maxPrice: BigDecimal): List<Item>
    fun findByVin(vin: String): Optional<Item>
    fun existsByVin(vin: String): Boolean
}