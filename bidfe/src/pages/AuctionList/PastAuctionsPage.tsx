import {AuctionListTemplate} from "./AuctionListTemplate.tsx";

export const PastAuctionsPage = () => {
    return (
        <AuctionListTemplate
            title="Past Auctions"
            status="SOLD"
            defaultSort="newly_ended"
            pageSize={1000}
        />
    );
};