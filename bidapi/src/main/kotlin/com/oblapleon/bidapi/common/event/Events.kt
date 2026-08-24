package com.oblapleon.bidapi.common.event

import com.oblapleon.bidapi.feature.user.entity.User
import java.util.UUID

/**
 * Event published when a user requests to update their profile (e.g. username, email).
 * Listeners can throw an exception to veto the update if the user has active engagements.
 */
data class UserUpdateRequestedEvent(val userId: Long)

/**
 * Event published when a user requests to delete their account.
 * Listeners can throw an exception to veto the deletion or perform cleanup.
 */
data class UserDeletionRequestedEvent(val user: User)

/**
 * Event published when an auction completes (either SOLD or UNSOLD).
 */
data class AuctionEndedEvent(
    val auctionId: UUID,
    val itemId: UUID,
    val isSold: Boolean,
    val winnerId: Long?
)

/**
 * Event published when an auction starts (moves from SCHEDULED to ACTIVE).
 */
data class AuctionStartedEvent(
    val auctionId: UUID,
    val itemId: UUID
)
