import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore.ts";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo } from "../shared/ui/details";
import { BiddingCard } from "../features/auction/ui/BiddingCard.tsx";
import { BidHistory } from "../features/auction/ui/BidHistory.tsx";
import { formatDistanceToNow } from "date-fns";
import type { ItemImageDto } from "../features/item/types.ts";
import "./AuctionDetails.css";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client"

const Lightbox = ({ images, initialIndex, onClose }: { images: ItemImageDto[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex)
    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images?.length) setIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images?.length) setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (!images?.length) return;
            if (e.key === "ArrowRight") setIndex((prev) => (prev + 1) % images.length);
            if (e.key === "ArrowLeft") setIndex((prev) => (prev - 1 + images.length) % images.length);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [images?.length, onClose]);

    if (!images || images.length === 0) return null;

    const currentImg = images[index];
    const url = currentImg?.url;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close-btn" aria-label="Close">✕</button>

            {images.length > 1 && (
                <>
                    <button className="lightbox-nav-btn left" onClick={handlePrev}>‹</button>
                    <button className="lightbox-nav-btn right" onClick={handleNext}>›</button>
                    <div className="lightbox-counter">{index + 1} / {images.length}</div>
                </>
            )}

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={url} alt="" className="lightbox-image" />
            </div>
        </div>
    );
};

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { auctionStore, authStore} = useStore();
    const [actionLoading, setActionLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isCanceling, setIsCanceling] = useState(false);
    const [showCancelTooltip, setShowCancelTooltip] = useState(false);
    useEffect(() => {
        if (!id) return;

        auctionStore.loadAuctionDetails(id);

        const stompClient = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/topic/auctions/${id}`, (message) => {
                    const notification = JSON.parse(message.body);
                    console.log("Live update received:", notification);
                    auctionStore.loadAuctionDetails(id);
                });
            },
        });

        stompClient.activate();
        return () => {
            stompClient.deactivate();
            auctionStore.clearSelectedAuction();
            auctionStore.clearError();
        };
    }, [id, auctionStore]);

    if (auctionStore.isLoading && !auctionStore.selectedAuction) {
        return <div className="details-loading">Loading Auction...</div>;
    }

    if (!auctionStore.selectedAuction) {
        return <div className="details-loading">Auction not found.</div>;
    }

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const user = authStore.user;

    const isOwner = user?.id?.toString() === item.seller.id.toString();
    const isAdmin = user?.roles?.some((r: { name: string }) => r.name === 'ADMIN');

    const isActive = auction.status === 'ACTIVE';
    const isPending = auction.status === 'PENDING_APPROVAL';
    const isCancelled = auction.status === 'CANCELLED';
    const isEnded = ['SOLD', 'UNSOLD', 'CANCELLED'].includes(auction.status);

    const handleApprove = async () => {
        setActionLoading(true);
        await auctionStore.approveAuction(auction.id);
        setActionLoading(false);
    };

    const handleCancelAuction = async () => {
        if (window.confirm(
            "Are you sure you want to cancel this auction? " +
            "The vehicle will be returned to your garage as a draft."
        )) {
            setIsCanceling(true);
            await auctionStore.cancelAuction(auction.id);
            setIsCanceling(false);
        }
    };

    return (
        <DetailPageLayout>
            <div className="compact-container">
                <DetailHeader onBack={() => navigate("/auctions")} title={`${item.year} ${item.make} ${item.model}`} />

                <div className="details-grid">
                    <div className="details-left">
                        <div className="gallery-wrapper">
                            <ImageGallery
                                item={item}
                                statusLabel={<StatusBadge status={auction.status} isNoReserve={auction.isNoReserve} />}
                                onImageClick={(index) => setLightboxIndex(index)}
                            />
                        </div>
                        <VehicleInfo item={item} />
                    </div>

                    <div className="details-right">

                        {isPending && (
                            <div className="compact-banner banner-pending">
                                <strong>Pending Approval</strong>
                                <p>{isOwner ? "Under review." : "Waiting for admin."}</p>
                            </div>
                        )}
                        {isCancelled && (
                            <div className="compact-banner banner-rejected">
                                <strong>Cancelled</strong>
                                <p>{isOwner ? "This listing was cancelled." : "Administratively removed."}</p>
                            </div>
                        )}

                        {isAdmin && isPending && (
                            <div className="admin-panel compact-card">
                                <div className="admin-btn-group">
                                    <button onClick={handleApprove} disabled={actionLoading} className="btn-approve">
                                        {actionLoading ? "..." : "✓ Approve"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isOwner && !isEnded && (
                            <div className="owner-panel compact-card" style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Owner Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div
                                        style={{ position: "relative", width: "100%" }}
                                        onMouseEnter={() => {
                                            if (auction.bidCount > 0 || isActive) setShowCancelTooltip(true); }}
                                        onMouseLeave={() => setShowCancelTooltip(false)}
                                    >
                                        <div style={{
                                            position: "absolute",
                                            bottom: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            marginBottom: "8px",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                            zIndex: 10,
                                            pointerEvents: "none",
                                            opacity: showCancelTooltip ? 1 : 0,
                                            visibility: showCancelTooltip ? "visible" : "hidden",
                                            transition: "opacity 0.2s ease-in-out, visibility 0.2s"
                                        }}>
                                            Cannot cancel active auction. Contact Support.
                                            <div style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                borderWidth: "5px",
                                                borderStyle: "solid",
                                                borderColor: "#ef4444 transparent transparent transparent"
                                            }} />
                                        </div>

                                        <button
                                            onClick={handleCancelAuction}
                                            disabled={isCanceling || auction.bidCount > 0 || isActive}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                background: "transparent",
                                                border: "none",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                cursor: (isCanceling || auction.bidCount > 0) ? "not-allowed" : "pointer",
                                                opacity: (isCanceling || auction.bidCount > 0) ? 0.5 : 1,
                                                pointerEvents: (isCanceling || auction.bidCount > 0) ? "none" : "auto"
                                            }}
                                        >
                                            {isCanceling ? "Canceling..." : "Cancel Auction"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isActive ? (
                            <div className="bidding-wrapper">
                                <BiddingCard auction={auction} />
                            </div>
                        ) : (
                            <div className={`status-card compact-card ${isCancelled ? 'card-rejected' : 'card-inactive'}`}>
                                <h4>
                                    {isPending && "Coming Soon"}
                                    {isCancelled && "Cancelled"}
                                    {isEnded && !isCancelled && `Auction ${auction.status}`}
                                </h4>
                                {isEnded && <span className="text-small">Ended {formatDistanceToNow(new Date(auction.endTime))} ago</span>}
                            </div>
                        )}

                        <div className="history-wrapper">
                            <BidHistory bids={auctionStore.bidHistory} />
                        </div>
                    </div>
                </div>
            </div>

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

const StatusBadge = ({ status, isNoReserve }: { status: string, isNoReserve: boolean }) => {
    let className = "badge-base ";
    switch (status) {
        case 'ACTIVE': className += "badge-active"; break;
        case 'PENDING_APPROVAL': className += "badge-pending"; break;
        case 'CANCELLED': className += "badge-rejected"; break;
        case 'SOLD': className += "badge-sold"; break;
        case 'UNSOLD': className += "badge-ended"; break;
        default: className += "badge-ended"; break;
    }

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <span className={className}>{status.replace('_', ' ')}</span>
            {isNoReserve && (
                <span className="badge-base" style={{ background: '#16a34a', color: '#fff' }}>
                    NO RESERVE
                </span>
            )}
        </div>
    );
};