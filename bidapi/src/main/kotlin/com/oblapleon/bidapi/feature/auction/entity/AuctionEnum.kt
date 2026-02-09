package com.oblapleon.bidapi.feature.auction.entity


enum class AuctionStatus {
    PENDING_APPROVAL, // Created by user, waiting for admin
    ACTIVE,           // Approved & Live (Bidding allowed)
    SOLD,             // Ended with winner
    EXPIRED,          // Ended without reserve met
    CANCELLED,        // Stopped by owner/admin
    REJECTED          // Denied by admin
}