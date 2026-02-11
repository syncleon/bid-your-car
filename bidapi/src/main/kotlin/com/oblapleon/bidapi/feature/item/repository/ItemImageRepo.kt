package com.oblapleon.bidapi.feature.item.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemImageRepository : BaseRepository<ItemImage, UUID> {

    /**
     * Standard fetch for the Item Details page gallery.
     * Guaranteed to return images in the correct visual order (Front, Side, Back, Interior).
     */
    fun findAllByItemIdOrderBySortOrderAsc(itemId: UUID): List<ItemImage>

    /**
     * Used when a user edits an item and removes specific photos.
     */
    fun deleteByItemIdAndId(itemId: UUID, id: UUID)

    /**
     * efficient cleanup.
     */
    fun deleteAllByItemId(itemId: UUID)
}