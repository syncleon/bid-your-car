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

        if (auction.winningBid?.bidder?.id == req.bidderId) {
            throw BadRequestException("You are already the highest bidder.")
        }

        val amount = if (req.isQuickBid) {
            if (auction.bidCount == 0) {
                auction.startPrice
            } else {
                auction.currentPrice.add(BidIncrementUtil.getDynamicBidIncrement(auction.currentPrice))
            }
        } else {
            req.maxAmount ?: throw BadRequestException("Bid amount must be provided.")
        }

        val minRequired = if (auction.bidCount == 0) auction.startPrice else auction.currentPrice.add(BidIncrementUtil.getDynamicBidIncrement(auction.currentPrice))
        if (amount < minRequired) {
            throw BadRequestException("Bid amount too low. Minimum required: $minRequired")
        }

        return amount
    }
}
