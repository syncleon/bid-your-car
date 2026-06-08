import java.math.BigDecimal;
public class Test {
    public static void main(String[] args) {
        BigDecimal startPrice = new BigDecimal("25000.00");
        BigDecimal minBidIncrement = new BigDecimal("100.00");
        BigDecimal maxAmount = new BigDecimal("25100");
        BigDecimal r = maxAmount.subtract(startPrice).remainder(minBidIncrement);
        System.out.println("r: " + r);
        System.out.println("compareTo: " + r.compareTo(BigDecimal.ZERO));
    }
}
