import {AuctionListTemplate} from "./AuctionListTemplate.tsx";

export const AuctionPage = () => {
    return (
        <AuctionListTemplate
            title="Auctions"
            status="ACTIVE"
            defaultSort="ending_soon"
            pageSize={1000}
        />
    );
};