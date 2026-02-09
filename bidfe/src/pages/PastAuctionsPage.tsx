import {AuctionListTemplate} from "../features/auction/ui/AuctionListTemplate.tsx";

export const PastAuctionsPage = () => {
    return (
        <AuctionListTemplate
            title="Results"
            status="SOLD"
            defaultSort="newly_ended"
            pageSize={1000}
        />
    );
};