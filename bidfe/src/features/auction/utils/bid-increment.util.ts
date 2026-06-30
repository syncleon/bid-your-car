export const getDynamicBidIncrement = (currentPrice: number): number => {
    if (currentPrice < 5) return 1;
    if (currentPrice < 40) return 5;
    if (currentPrice < 100) return 10;
    if (currentPrice < 500) return 25;
    if (currentPrice < 1000) return 50;
    if (currentPrice < 5000) return 100;
    if (currentPrice < 25000) return 250;
    if (currentPrice < 50000) return 500;
    if (currentPrice < 100000) return 1000;
    return 2500;
};
