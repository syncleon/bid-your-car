package com.oblapleon.bidapi.feature.auction.entity

enum class AuctionStatus {
    ACTIVE,     // Currently bidding
    SOLD,       // Successfully ended
    EXPIRED,    // Time ran out, reserve not met / no bids
    CANCELLED   // Manually stopped
}