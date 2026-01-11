package com.oblapleon.bidapi.feature.item.repo

import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface ItemImageRepo : JpaRepository<ItemImage, UUID> {
    fun findByItemId(itemId: UUID): List<ItemImage>
}