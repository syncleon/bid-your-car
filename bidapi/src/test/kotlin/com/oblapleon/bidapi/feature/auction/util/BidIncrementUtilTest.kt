package com.oblapleon.bidapi.feature.auction.util

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class BidIncrementUtilTest {

    @Test
    fun `should return 100 for price below 15000`() {
        assertEquals(BigDecimal("100.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("0.00")))
        assertEquals(BigDecimal("100.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("500.00")))
        assertEquals(BigDecimal("100.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("14999.00")))
    }

    @Test
    fun `should return 250 for price between 15000 and 49999`() {
        assertEquals(BigDecimal("250.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("15000.00")))
        assertEquals(BigDecimal("250.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("30000.00")))
        assertEquals(BigDecimal("250.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("49999.00")))
    }

    @Test
    fun `should return 500 for price between 50000 and 199999`() {
        assertEquals(BigDecimal("500.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("50000.00")))
        assertEquals(BigDecimal("500.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("120000.00")))
        assertEquals(BigDecimal("500.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("199999.00")))
    }

    @Test
    fun `should return 1000 for price 200000 and above`() {
        assertEquals(BigDecimal("1000.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("200000.00")))
        assertEquals(BigDecimal("1000.00"), BidIncrementUtil.getDynamicBidIncrement(BigDecimal("500000.00")))
    }
}
