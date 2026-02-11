package com.oblapleon.bidapi.feature.bid.entity

enum class BidStatus {
    ACCEPTED,   // Valid active bid
    OUTBID,     // Was valid, but someone bid higher (optional optimization)
    WINNING,    // The final bid that won the auction
    RETRACTED,  // User cancelled (if policy allows)
    VOIDED,     // Admin cancelled (fraud/error)
    REJECTED    // System rejected (e.g. below reserve or insufficient funds)
}