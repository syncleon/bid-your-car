package com.oblapleon.bidapi.feature.auction.util

import java.math.BigDecimal

/**
 * Utility for calculating standard auction bid increments based on the current price.
 */
object BidIncrementUtil {
    private val TIER_15K = BigDecimal("15000.00")
    private val TIER_50K = BigDecimal("50000.00")
    private val TIER_200K = BigDecimal("200000.00")

    private val INC_100 = BigDecimal("100.00")
    private val INC_250 = BigDecimal("250.00")
    private val INC_500 = BigDecimal("500.00")
    private val INC_1000 = BigDecimal("1000.00")

    /**
     * Determines the next required bid increment amount dynamically based on Cars & Bids price tiers:
     * - Up to $14,999: $100
     * - $15,000 – $49,999: $250
     * - $50,000 – $199,999: $500
     * - $200,000+: $1,000
     *
     * @param currentPrice The current highest bid or starting price.
     * @return The required increment amount to add for the next valid bid.
     */
    fun getDynamicBidIncrement(currentPrice: BigDecimal): BigDecimal {
        return when {
            currentPrice < TIER_15K -> INC_100
            currentPrice < TIER_50K -> INC_250
            currentPrice < TIER_200K -> INC_500
            else -> INC_1000
        }
    }
}
