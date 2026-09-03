package com.oblapleon.bidapi.feature.item.listener

import com.oblapleon.bidapi.common.event.AuctionEndedEvent
import com.oblapleon.bidapi.common.event.AuctionStartedEvent
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
class ItemAuctionEventListener(
    private val itemRepository: ItemRepository
) {
    private val logger = LoggerFactory.getLogger(ItemAuctionEventListener::class.java)

    /**
     * Updates the item status when an auction starts.
     * Uses REQUIRES_NEW because the auction activation happens in its own transaction.
     */
    @org.springframework.transaction.event.TransactionalEventListener(phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @org.springframework.cache.annotation.CacheEvict(value = ["items"], key = "#event.itemId")
    fun onAuctionStarted(event: AuctionStartedEvent) {
        val item = itemRepository.findById(event.itemId).orElse(null) ?: return
        item.status = ItemStatus.ACTIVE_AUCTION
        itemRepository.save(item)
        logger.info("Updated item {} status to ACTIVE_AUCTION due to auction start", event.itemId)
    }

    /**
     * Updates the item status when an auction ends (SOLD or UNSOLD).
     * Uses REQUIRES_NEW because the auction finalization happens in its own transaction.
     */
    @org.springframework.transaction.event.TransactionalEventListener(phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @org.springframework.cache.annotation.CacheEvict(value = ["items"], key = "#event.itemId")
    fun onAuctionEnded(event: AuctionEndedEvent) {
        val item = itemRepository.findById(event.itemId).orElse(null) ?: return
        if (event.isSold) {
            item.status = ItemStatus.SOLD
        } else {
            item.status = ItemStatus.UNSOLD
            item.auctionId = null
        }
        itemRepository.save(item)
        logger.info("Updated item {} status to {} due to auction end", event.itemId, item.status)
    }
}
