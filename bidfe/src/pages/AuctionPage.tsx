import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { auctionStore } from "../features/auction/model/auction.store";
import {AuctionCard} from "../features/auction/ui/AuctionCard.tsx";

export const AuctionPage = observer(() => {

    useEffect(() => {
        // Load active auctions when the page mounts
        auctionStore.loadAuctions("ACTIVE");
    }, []);

    // Loading State
    if (auctionStore.isLoading && auctionStore.auctions.length === 0) {
        return (
            <div style={{ padding: 60, textAlign: "center", color: "#999", fontSize: "14px" }}>
                Loading live auctions...
            </div>
        );
    }

    // Error State
    if (auctionStore.error) {
        return (
            <div style={{ padding: 40 }}>
                <div style={{ color: "#dc2626", fontSize: "14px" }}>
                    Unable to load auctions: {auctionStore.error}
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h1 style={pageTitleStyle}>Live Auctions</h1>
                <p style={subtitleStyle}>
                    {auctionStore.auctions.length} {auctionStore.auctions.length === 1 ? 'vehicle' : 'vehicles'} currently open for bidding
                </p>
            </header>

            {auctionStore.auctions.length === 0 ? (
                <div style={emptyStateStyle}>
                    <h3>No live auctions</h3>
                    <p>Check back later for new inventory.</p>
                </div>
            ) : (
                <div style={gridStyle}>
                    {auctionStore.auctions.map((auction) => (
                        <AuctionCard
                            key={auction.id}
                            auction={auction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Styles ---

const containerStyle: React.CSSProperties = {
    padding: "40px 24px",
    maxWidth: 1200,
    margin: "0 auto"
};

const headerStyle: React.CSSProperties = {
    marginBottom: "40px",
    paddingBottom: "16px",
    borderBottom: "1px solid #eee"
};

const pageTitleStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: 700,
    color: "#111",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px"
};

const subtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#666",
    margin: 0
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    // Slightly wider cards (300px) for auctions to accommodate timer/bid info comfortably
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "40px 32px",
    alignItems: "start"
};

const emptyStateStyle: React.CSSProperties = {
    textAlign: "center",
    marginTop: 80,
    color: "#999",
    padding: "40px",
    fontSize: "14px"
};