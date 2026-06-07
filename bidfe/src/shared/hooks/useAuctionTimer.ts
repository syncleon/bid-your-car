import { useState, useEffect } from "react";

export const useAuctionTimer = (endTime: string) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isEnded, setIsEnded] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setIsEnded(true);
                setTimeLeft("Ended");
                setIsUrgent(false);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days} ${days === 1 ? "Day" : "Days"}`);
                setIsUrgent(false);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
                setIsUrgent(false);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
                setIsUrgent(true); // Less than 1 hour remains
            } else {
                setTimeLeft(`${seconds}s`);
                setIsUrgent(true); // Less than 1 minute remains
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return { timeLeft, isEnded, isUrgent };
};
