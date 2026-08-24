package com.oblapleon.bidapi.feature.auction.util

import java.math.BigDecimal

/**
 * Utility for calculating standard auction bid increments based on the current price.
 */
object BidIncrementUtil {
    /**
     * Determines the next required bid increment amount dynamically based on the current price tier.
     *
     * @param currentPrice The current highest bid or starting price.
     * @return The required increment amount to add for the next valid bid.
     */
    fun getDynamicBidIncrement(currentPrice: BigDecimal): BigDecimal {
        val price = currentPrice.toDouble()
        return when {
            price < 5.0 -> BigDecimal("1.00")
            price < 40.0 -> BigDecimal("5.00")
            price < 100.0 -> BigDecimal("10.00")
            price < 500.0 -> BigDecimal("25.00")
            price < 1000.0 -> BigDecimal("50.00")
            price < 5000.0 -> BigDecimal("100.00")
            price < 25000.0 -> BigDecimal("250.00")
            price < 50000.0 -> BigDecimal("500.00")
            price < 100000.0 -> BigDecimal("1000.00")
            else -> BigDecimal("2500.00")
        }
    }
}
