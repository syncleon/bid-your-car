package com.oblapleon.bidapi.feature.auction.event

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.bid.entity.Bid

data class BidPlacedEvent(
    val auction: Auction,
    val savedBid: Bid,
    val bidderUsername: String
)
