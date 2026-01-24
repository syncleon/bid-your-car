package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.item.dto.toDto


fun Auction.toDto(): AuctionDto {
    val highestBid = this.currentHighestBid
    return AuctionDto(
        id = this.id!!,
        item = this.item.toDto(),
        startTime = this.startTime.atZone(java.time.ZoneId.systemDefault()).toInstant(),
        endTime = this.endTime.atZone(java.time.ZoneId.systemDefault()).toInstant(),
        status = this.status,
        startPrice = this.startPrice,
        minBidIncrement = this.minBidIncrement,
        currentHighestBid = highestBid,
        bidCount = this.bids.size,
        isReserveMet = this.reservePrice?.let { highestBid >= it } ?: true,
        winnerId = this.winnerUser?.id
    )
}