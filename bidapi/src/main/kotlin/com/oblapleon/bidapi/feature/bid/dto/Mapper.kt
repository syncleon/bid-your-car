package com.oblapleon.bidapi.feature.bid.dto

import com.oblapleon.bidapi.feature.bid.entity.Bid

fun Bid.toDto(): BidResp = BidResp(
    id = this.id!!,
    auctionId = this.auction.id!!,
    bidderId = this.bidder.id!!,
    bidderName = this.bidder.username,
    amount = this.amount,
    bidTime = this.bidTime
)

fun List<Bid>.toRespList(): List<BidResp> = this.map { it.toDto() }