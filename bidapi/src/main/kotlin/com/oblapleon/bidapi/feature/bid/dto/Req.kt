package com.oblapleon.bidapi.feature.bid.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.util.UUID

data class BidRequest(
    @field:NotNull(message = "Bid amount is required")
    @field:DecimalMin(value = "0.01", message = "Bid amount must be positive")
    var amount: BigDecimal
)