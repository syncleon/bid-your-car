package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.item.dto.toDto
import java.time.ZoneId


fun Auction.toDto(): AuctionDto {
    val highestBid = this.currentHighestBid
    val zone = ZoneId.systemDefault()

    return AuctionDto(
        id = this.id!!,
        item = this.item.toDto(),
        startTime = this.startTime.atZone(zone).toInstant(),
        endTime = this.endTime.atZone(zone).toInstant(),
        status = this.status,
        startPrice = this.startPrice,
        minBidIncrement = this.minBidIncrement,
        currentHighestBid = highestBid,
        bidCount = this.bids.size,
        isReserveMet = this.reservePrice?.let { highestBid >= it } ?: true,
        winnerId = this.winnerUser?.id
    )
}