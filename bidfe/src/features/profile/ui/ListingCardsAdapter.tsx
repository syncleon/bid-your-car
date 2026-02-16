import { AuctionCard } from "../../auction/ui/AuctionCard";
import { ItemCard } from "../../item/ui/ItemCard";
import { AuctionCardLoader } from "../../auction/ui/AuctionCardLoader";
import type { ItemDto } from "../../item/types";

interface Props {
    item: ItemDto;
}

export const ListingCardAdapter = ({ item }: Props) => {
    if (item.auction) {
        return <AuctionCard auction={item.auction} />;
    }

    if (item.activeAuctionId && item.auctionStatus === "ACTIVE") {
        return (
            <AuctionCardLoader
                auctionId={item.activeAuctionId}
                fallbackItem={item}
            />
        );
    }

    return <ItemCard item={item} />;
};