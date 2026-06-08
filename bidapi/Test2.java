import java.math.BigDecimal;
public class Test2 {
    public static void main(String[] args) {
        BigDecimal startPrice = new BigDecimal("15000.00");
        BigDecimal minBidIncrement = new BigDecimal("100.00");
        BigDecimal maxAmount = new BigDecimal("15100");
        
        System.out.println(maxAmount.subtract(startPrice).remainder(minBidIncrement));
    }
}
