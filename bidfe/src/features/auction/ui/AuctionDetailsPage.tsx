import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo } from "../../../shared/ui/details";
import { BiddingCard } from "./BiddingCard";
import { BidHistory } from "./BidHistory";
import { formatDistanceToNow } from "date-fns";
import "./AuctionDetails.css";

// --- LIGHTBOX COMPONENT (Unchanged) ---
const Lightbox = ({ images, initialIndex, onClose }: { images: any[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIndex((prev) => (prev + 1) % images.length);
            if (e.key === "ArrowLeft") setIndex((prev) => (prev - 1 + images.length) % images.length);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [images.length, onClose]);

    const currentImg = images[index];
    const url = currentImg.fullHdUrl || currentImg.originalUrl || currentImg.url;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close-btn" aria-label="Close">✕</button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={url} alt="" className="lightbox-image" />
            </div>
            {images.length > 1 && (
                <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
                    <button className="lightbox-nav-btn" onClick={handlePrev}>‹</button>
                    <div className="lightbox-counter">{index + 1} / {images.length}</div>
                    <button className="lightbox-nav-btn" onClick={handleNext}>›</button>
                </div>
            )}
        </div>
    );
};

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auctionStore, authStore } = useStore();
    const [actionLoading, setActionLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            auctionStore.loadAuctionDetails(id);
        }
        return () => {
            auctionStore.clearSelectedAuction();
            auctionStore.clearError();
        };
    }, [id, auctionStore]);

    if (auctionStore.isLoading || !auctionStore.selectedAuction) {
        return <div className="details-loading">Loading...</div>;
    }

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const user = authStore.user;
    const isOwner = user?.id === item.seller.id;
    const isAdmin = user?.roles.some(r => r.name === 'ADMIN');

    const isActive = auction.status === 'ACTIVE';
    const isPending = auction.status === 'PENDING_APPROVAL';
    const isRejected = auction.status === 'REJECTED';
    const isEnded = ['SOLD', 'EXPIRED', 'CANCELLED'].includes(auction.status);

    const handleApprove = async () => {
        setActionLoading(true);
        await auctionStore.approveAuction(auction.id);
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!window.confirm("Reject?")) return;
        setActionLoading(true);
        await auctionStore.rejectAuction(auction.id);
        navigate("/auctions");
        setActionLoading(false);
    };

    return (
        <DetailPageLayout>
            <div className="compact-container">
                {/* Header is now more compact */}
                <DetailHeader onBack={() => navigate("/auctions")} title={`${item.year} ${item.make} ${item.model}`} />

                <div className="details-grid">
                    {/* LEFT COLUMN: Visuals & Specs */}
                    <div className="details-left">
                        <div className="gallery-wrapper">
                            <ImageGallery
                                item={item}
                                statusLabel={<StatusBadge status={auction.status} />}
                                onImageClick={(index) => setLightboxIndex(index)}
                            />
                        </div>
                        <VehicleInfo item={item} />
                    </div>

                    {/* RIGHT COLUMN: Actions & Status (Banners moved here for compactness) */}
                    <div className="details-right">

                        {/* 1. Alerts/Banners Stacked Here */}
                        {auctionStore.error && (
                            <div className="compact-banner banner-error">
                                <span>{auctionStore.error}</span>
                                <button onClick={() => auctionStore.clearError()}>✕</button>
                            </div>
                        )}
                        {isPending && (
                            <div className="compact-banner banner-pending">
                                <strong>⚠️ Pending Approval</strong>
                                <p>{isOwner ? "Under review." : "Waiting for admin."}</p>
                            </div>
                        )}
                        {isRejected && (
                            <div className="compact-banner banner-rejected">
                                <strong>⛔ Rejected</strong>
                                <p>{isOwner ? "Check email." : "Declined."}</p>
                            </div>
                        )}

                        {/* 2. Admin Controls */}
                        {isAdmin && isPending && (
                            <div className="admin-panel compact-card">
                                <div className="admin-btn-group">
                                    <button onClick={handleApprove} disabled={actionLoading} className="btn-approve">
                                        {actionLoading ? "..." : "✓ Approve"}
                                    </button>
                                    <button onClick={handleReject} disabled={actionLoading} className="btn-reject">
                                        {actionLoading ? "..." : "✕ Reject"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Main Bidding Card */}
                        {isActive ? (
                            <div className="bidding-wrapper">
                                <BiddingCard auction={auction} />
                            </div>
                        ) : (
                            <div className={`status-card compact-card ${isRejected ? 'card-rejected' : 'card-inactive'}`}>
                                <h4>
                                    {isPending && "Coming Soon"}
                                    {isRejected && "Rejected"}
                                    {isEnded && `Auction ${auction.status}`}
                                </h4>
                                {isEnded && <span className="text-small">Ended {formatDistanceToNow(new Date(auction.endTime))} ago</span>}
                            </div>
                        )}

                        {/* 4. Bid History (Scrollable) */}
                        <div className="history-wrapper">
                            <BidHistory bids={auctionStore.bidHistory} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && item.images && item.images.length > 0 && (
                <Lightbox
                    images={item.images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </DetailPageLayout>
    );
});

const StatusBadge = ({ status }: { status: string }) => {
    let className = "badge-base ";
    switch (status) {
        case 'ACTIVE': className += "badge-active"; break;
        case 'PENDING_APPROVAL': className += "badge-pending"; break;
        case 'REJECTED': className += "badge-rejected"; break;
        case 'SOLD': className += "badge-sold"; break;
        default: className += "badge-ended"; break;
    }
    return <span className={className}>{status.replace('_', ' ')}</span>;
};