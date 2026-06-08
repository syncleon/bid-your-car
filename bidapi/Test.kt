import java.math.BigDecimal

fun main() {
    val startPrice = BigDecimal("15000.00")
    val minBidIncrement = BigDecimal("100.00")
    val maxAmount = BigDecimal("15100")
    val remainder = maxAmount.subtract(startPrice).remainder(minBidIncrement)
    println("remainder: $remainder")
    println("compareTo ZERO: ${remainder.compareTo(BigDecimal.ZERO)}")
}
