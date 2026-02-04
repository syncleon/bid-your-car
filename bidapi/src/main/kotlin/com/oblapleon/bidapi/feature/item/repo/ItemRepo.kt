package com.oblapleon.bidapi.feature.item.repo

import com.oblapleon.bidapi.feature.item.entity.Item
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemRepo : JpaRepository<Item, UUID> {

    @Query("SELECT i FROM Item i WHERE i.seller.deletedAt IS NULL")
    fun findAllActive(pageable: Pageable): Page<Item>

    fun findBySellerId(sellerId: Long, pageable: Pageable): Page<Item>

    fun existsByVin(vin: String): Boolean
}