package com.oblapleon.bidapi.feature.bid.listener

import com.oblapleon.bidapi.common.event.UserDeletionRequestedEvent
import com.oblapleon.bidapi.common.event.UserUpdateRequestedEvent
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class BidUserEventListener(
    private val bidRepository: BidRepository
) {
    private val logger = LoggerFactory.getLogger(BidUserEventListener::class.java)

    /**
     * Blocks user profile updates if they have active bids on ongoing auctions.
     */
    @EventListener
    fun onUserUpdateRequested(event: UserUpdateRequestedEvent) {
        if (bidRepository.countActiveBidsByBidderId(event.userId) > 0) {
            logger.warn("User {} attempted to update profile but has active bids.", event.userId)
            throw ConflictException("Cannot update profile: You have active bids on ongoing auctions.")
        }
    }

    /**
     * Blocks account deletion if the user has active bids on ongoing auctions.
     */
    @EventListener
    fun onUserDeletionRequested(event: UserDeletionRequestedEvent) {
        if (bidRepository.countActiveBidsByBidderId(event.user.id!!) > 0) {
            logger.warn("User {} attempted to delete account but has active bids.", event.user.id)
            throw ConflictException("Cannot delete account: You have active bids on ongoing auctions. Please wait until they finish.")
        }
    }
}
