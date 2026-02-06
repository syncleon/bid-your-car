import { AuctionCard } from "../../auction/ui/AuctionCard";
import { ItemCard } from "../../item/ui/ItemCard";
import { AuctionCardLoader } from "../../auction/ui/AuctionCardLoader"; // Import the new loader
import type { ItemDto } from "../../item/types";

interface Props {
    item: ItemDto;
}

export const ListingCardAdapter = ({ item }: Props) => {
    // 1. Optimal Case: We already have the full data
    if (item.auction) {
        return <AuctionCard auction={item.auction} />;
    }

    // 2. Missing Data Case: We have an ID, but no object. Fetch it!
    if (item.activeAuctionId && item.auctionStatus === 'ACTIVE') {
        return (
            <AuctionCardLoader
                auctionId={item.activeAuctionId}
                fallbackItem={item}
            />
        );
    }

    // 3. Fallback: Standard Item
    return <ItemCard item={item} />;
};