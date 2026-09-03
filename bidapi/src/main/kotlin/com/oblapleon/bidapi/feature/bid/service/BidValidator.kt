package com.oblapleon.bidapi.feature.bid.service

import com.oblapleon.bidapi.common.exception.BadRequestException
import com.oblapleon.bidapi.feature.auction.entity.Auction
import com.oblapleon.bidapi.feature.auction.util.BidIncrementUtil
import org.springframework.stereotype.Component
import java.math.BigDecimal

@Component
class BidValidator {

    fun validateAndCalculateAmount(auction: Auction, req: BidRequestMessage): BigDecimal {
        if (req.placedAt.isAfter(auction.endTime)) {
            throw BadRequestException("Auction has already ended.")
        }

        if (auction.item.seller.id == req.bidderId) {
            throw BadRequestException("Seller cannot bid on their own item.")
        }

        return if (req.isQuickBid) {
            if (auction.bidCount == 0) {
                auction.startPrice
            } else {
                auction.currentPrice.add(BidIncrementUtil.getDynamicBidIncrement(auction.currentPrice))
            }
        } else {
            req.maxAmount ?: throw BadRequestException("Max amount must be provided for non-quick bids.")
        }
    }
}
