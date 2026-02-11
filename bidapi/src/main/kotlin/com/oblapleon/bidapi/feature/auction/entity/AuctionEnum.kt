package com.oblapleon.bidapi.feature.auction.entity

enum class AuctionStatus {
    DRAFT,            // Seller is still editing details
    PENDING_APPROVAL, // Waiting for admin to approve listing
    SCHEDULED,        // Approved, but start_time is in the future
    ACTIVE,           // Live bidding is open
    ENDED_PENDING,    // Time up, system processing winner/reserve logic
    SOLD,             // Winner declared and reserve met
    UNSOLD,           // Time up, no bids or reserve not met
    CANCELLED         // Administratively removed
}