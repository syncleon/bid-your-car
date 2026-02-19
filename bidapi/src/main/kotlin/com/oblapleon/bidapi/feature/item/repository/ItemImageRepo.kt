package com.oblapleon.bidapi.feature.item.repository

import com.oblapleon.bidapi.common.repository.BaseRepository
import com.oblapleon.bidapi.feature.item.entity.ImageCategory
import com.oblapleon.bidapi.feature.item.entity.ItemImage
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemImageRepository : BaseRepository<ItemImage, UUID> {

    /**
     * Standard fetch for the Item Details page gallery.
     * Guaranteed to return images in the correct visual order.
     */
    fun findAllByItemIdOrderBySortOrderAsc(itemId: UUID): List<ItemImage>

    /**
     * Fetch images grouped by a specific category (e.g., Only INTERIOR shots).
     * Great for the frontend gallery tabs.
     */
    fun findAllByItemIdAndCategoryOrderBySortOrderAsc(itemId: UUID, category: ImageCategory): List<ItemImage>

    /**
     * CRITICAL for upload logic: Finds the current MAIN image for an item.
     * Used in ItemService to demote the old MAIN image when a new one is uploaded.
     */
    fun findFirstByItemIdAndCategory(itemId: UUID, category: ImageCategory): ItemImage?

    /**
     * Used when a user edits an item and removes specific photos.
     */
    fun deleteByItemIdAndId(itemId: UUID, id: UUID)

    /**
     * Efficient cleanup when deleting an entire item.
     */
    fun deleteAllByItemId(itemId: UUID)
}