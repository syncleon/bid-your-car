import java.math.BigDecimal

val startPrice = BigDecimal("25000.00")
val minBidIncrement = BigDecimal("100.00")
val maxAmount = BigDecimal("25100.00")

val remainder = maxAmount.subtract(startPrice).remainder(minBidIncrement)
println("Remainder: $remainder")
println("CompareTo Zero: ${remainder.compareTo(BigDecimal.ZERO)}")

val maxAmount2 = BigDecimal("25000.00")
val remainder2 = maxAmount2.subtract(startPrice).remainder(minBidIncrement)
println("Remainder2: $remainder2")
println("CompareTo Zero 2: ${remainder2.compareTo(BigDecimal.ZERO)}")
