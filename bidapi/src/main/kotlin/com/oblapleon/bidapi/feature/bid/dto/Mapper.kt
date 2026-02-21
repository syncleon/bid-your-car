package com.oblapleon.bidapi.feature.bid.dto

import com.oblapleon.bidapi.feature.bid.entity.Bid

fun Bid.toDto(): BidDto {
    return BidDto(
        id = this.id!!,
        auctionId = this.auction.id!!,
        bidderId = this.bidder.id!!,
        bidderName = this.bidder.username,
        amount = this.amount,
        bidTime = this.bidTime
    )
}