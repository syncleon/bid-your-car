package com.oblapleon.bidapi.feature.auction.entity


enum class AuctionStatus {
    DRAFT,      // Created but not yet live
    ACTIVE,     // Open for bidding
    SOLD,       // Time ended and Reserve Price was met
    EXPIRED,    // Time ended but Reserve Price was NOT met
    CANCELLED   // Manually stopped by admin or seller
}