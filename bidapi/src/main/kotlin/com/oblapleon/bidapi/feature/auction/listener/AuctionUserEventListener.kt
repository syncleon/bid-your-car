package com.oblapleon.bidapi.feature.auction.listener

import com.oblapleon.bidapi.common.event.UserDeletionRequestedEvent
import com.oblapleon.bidapi.common.event.UserUpdateRequestedEvent
import com.oblapleon.bidapi.common.exception.ConflictException
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
class AuctionUserEventListener(
    private val auctionRepository: AuctionRepository
) {
    private val logger = LoggerFactory.getLogger(AuctionUserEventListener::class.java)

    /**
     * Blocks user profile updates if they have active auction listings.
     */
    @EventListener
    fun onUserUpdateRequested(event: UserUpdateRequestedEvent) {
        if (auctionRepository.existsActiveAuctionsBySellerId(event.userId)) {
            logger.warn("User {} attempted to update profile but has active auctions.", event.userId)
            throw ConflictException("Cannot update profile: You have active auction listings.")
        }
    }

    /**
     * Blocks account deletion if the user has active auctions with bids.
     * Otherwise, cancels their active auctions.
     */
    @EventListener
    fun onUserDeletionRequested(event: UserDeletionRequestedEvent) {
        val userId = event.user.id!!
        if (auctionRepository.existsBySellerIdAndStatusAndBidsIsNotEmpty(userId)) {
            logger.warn("User {} attempted to delete account but has active auctions with bids.", userId)
            throw ConflictException("Cannot delete account: You have active auctions with bids.")
        }
        
        logger.info("Canceling active auctions for user {} prior to account deletion.", userId)
        auctionRepository.cancelAllActiveAuctionsBySellerId(userId)
    }
}
