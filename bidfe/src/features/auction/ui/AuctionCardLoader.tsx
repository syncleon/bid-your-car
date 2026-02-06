import { useEffect, useState } from "react";
import { AuctionCard } from "./AuctionCard";
import { getAuctionById } from "../api/auction.api"; // Import from step 1
import type { AuctionDto } from "../types";
import {BaseCard} from "../../../widgets/BaseCard/BaseCard.tsx";
import styles from "../../../widgets/BaseCard/styles.ts";

interface Props {
    auctionId: string;
    // Pass the fallback item data so we can show a skeleton/loading state that looks correct
    fallbackItem: any;
}

export const AuctionCardLoader = ({ auctionId, fallbackItem }: Props) => {
    const [auction, setAuction] = useState<AuctionDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getAuctionById(auctionId)
            .then(data => {
                if (mounted) setAuction(data);
            })
            .catch(err => console.error("Failed to load auction card:", err))
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [auctionId]);

    // 1. Success: Render the real card
    if (auction) {
        return <AuctionCard auction={auction} />;
    }

    // 2. Loading State: Render a placeholder card
    return (
        <BaseCard
            to={`/auctions/${auctionId}`}
            imageUrl={fallbackItem.images?.[0]?.thumbnailUrl}
            title={{ year: fallbackItem.year, make: fallbackItem.make, model: fallbackItem.model }}
            overlays={{
                topLeft: (
                    <div style={styles.badgeLive}>
                        <span style={styles.dot} /> {loading ? "LOADING..." : "LIVE"}
                    </div>
                )
            }}
        >
            <div style={styles.metaRow}>
                <div style={{ color: "#999", fontSize: "14px", fontStyle: "italic" }}>
                    {loading ? "Fetching bid info..." : "Auction data unavailable"}
                </div>
                <div style={styles.locationText}>{fallbackItem.location}</div>
            </div>
        </BaseCard>
    );
};