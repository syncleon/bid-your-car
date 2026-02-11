package com.oblapleon.bidapi.feature.auction.dto

import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.item.dto.toDto


fun Auction.toDto(): AuctionDto {
    return AuctionDto(
        id = this.id!!,
        item = this.item.toDto(),
        status = this.status,
        startTime = this.startTime,
        endTime = this.endTime,

        startPrice = this.startPrice,
        currentPrice = this.currentPrice,
        minBidIncrement = this.minBidIncrement,
        reservePrice = this.reservePrice,
        isReserveMet = this.isReserveMet,

        // Use persisted counter (Performance optimization)
        bidCount = this.bidCount,

        winnerId = this.winnerUser?.id
    )
}