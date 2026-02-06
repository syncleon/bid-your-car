import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo, ResponsiveGrid } from "../../../shared/ui/details";
import {BiddingCard} from "./BiddingCard.tsx";
import {BidHistory} from "./BidHistory.tsx";

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auctionStore, authStore } = useStore();

    useEffect(() => {
        if (id) auctionStore.loadAuctionDetails(id);
        return () => { auctionStore.clearSelectedAuction(); auctionStore.clearError(); };
    }, [id, auctionStore]);

    if (auctionStore.isLoading || !auctionStore.selectedAuction)
        return <div style={{padding:80,textAlign:'center',color:'#999'}}>Loading...</div>;

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const isOwner = authStore.user?.id === item.seller.id;
    const isActive = auction.status === 'ACTIVE';

    // Disable Logic
    const hasBids = auction.bidCount > 0;
    const isCancelDisabled = auctionStore.isLoading || hasBids;

    const handleCancelAuction = async () => {
        if (isCancelDisabled) return;
        if (window.confirm("Are you sure? This action cannot be undone.")) {
            const success = await auctionStore.cancelAuction(auction.id);
            if (success) navigate(`/items/${auction.item.id}`);
        }
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate("/auctions")} title="Back to Feed" />

            {auctionStore.error && (
                <div style={pageStyles.errorBanner}>
                    {auctionStore.error}
                    <button onClick={() => auctionStore.clearError()} style={pageStyles.closeBtn}>✕</button>
                </div>
            )}

            <ResponsiveGrid>
                {/* LEFT: Media & Vehicle Info */}
                <div>
                    <ImageGallery
                        item={item}
                        statusLabel={<span style={isActive ? badges.live : badges.ended}>{isActive ? "LIVE" : auction.status}</span>}
                    />
                    <VehicleInfo item={item} />
                </div>

                {/* RIGHT: Sidebar Hierarchy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* 1. Primary Action: Bidding */}
                    <BiddingCard auction={auction} />

                    {/* 2. Context: History */}
                    <BidHistory bids={auctionStore.bidHistory} />

                    {/* 3. Admin: Seller Actions (Moved to Bottom) */}
                    {isOwner && isActive && (
                        <div style={pageStyles.adminBox}>
                            <div style={pageStyles.adminTitle}>Seller Zone</div>
                            <button
                                onClick={handleCancelAuction}
                                disabled={isCancelDisabled}
                                style={{
                                    ...pageStyles.btnDestructive,
                                    opacity: isCancelDisabled ? 0.5 : 1,
                                    cursor: isCancelDisabled ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {auctionStore.isLoading ? "Processing..." : "Cancel Auction"}
                            </button>
                            {hasBids && (
                                <div style={pageStyles.hint}>⚠️ Cannot cancel: Bids placed</div>
                            )}
                        </div>
                    )}
                </div>
            </ResponsiveGrid>
        </DetailPageLayout>
    );
});

const badges = {
    live: { background: "#000", color: "#fff", padding: "4px 8px", borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: 1 },
    ended: { background: "#9ca3af", color: "#fff", padding: "4px 8px", borderRadius: 2, fontSize: 11, fontWeight: 700 }
};

const pageStyles = {
    errorBanner: { background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 6, marginBottom: 24, display: 'flex', alignItems: 'center' },
    closeBtn: { background:'none', border:'none', marginLeft:'auto', cursor:'pointer', color: 'inherit' },

    // Minimalistic Admin Box
    adminBox: { borderTop: "1px solid #f3f4f6", paddingTop: 20 },
    adminTitle: { fontSize: "12px", fontWeight: 700, color: "#999", textTransform: "uppercase" as const, marginBottom: 12 },

    btnDestructive: { width: "100%", padding: "10px", background: "#fff", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, fontWeight: 600, fontSize: "13px", transition: "all 0.2s" },
    hint: { fontSize: 11, color: "#dc2626", marginTop: 8, textAlign: "center" as const }
};