package com.oblapleon.bidapi.feature.item.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemImageRepository : BaseRepository<ItemImage, UUID> {

    fun findAllByItemIdOrderBySortOrderAsc(itemId: UUID): List<ItemImage>
    fun findAllByItemIdAndCategoryOrderBySortOrderAsc(itemId: UUID, category: ImageCategory): List<ItemImage>
    fun findFirstByItemIdAndCategory(itemId: UUID, category: ImageCategory): ItemImage?
    fun deleteByItemIdAndId(itemId: UUID, id: UUID)
    fun deleteAllByItemId(itemId: UUID)
}