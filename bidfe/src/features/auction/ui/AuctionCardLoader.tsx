import { useEffect, useState } from "react";
import { AuctionCard } from "./AuctionCard";
import { getAuctionById } from "../api/auction.api";
import type { AuctionDto } from "../types";
import type { ItemDto } from "../../item/types"; 
import { BaseCard } from "../../../widgets/BaseCard/BaseCard";
import styles from "../../../widgets/BaseCard/styles";

interface Props {
    auctionId: string;
    fallbackItem: ItemDto;
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

    if (auction) {
        return <AuctionCard auction={auction} />;
    }
    const fallbackImage = fallbackItem.images?.[0]?.url || fallbackItem.thumbnailUrl;
    return (
        <BaseCard
            to={`/auctions/${auctionId}`}
            imageUrl={fallbackImage}
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