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
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ConfirmDialog } from "../shared/ui/dialog/ConfirmDialog";

const getWebSocketUrl = () => {
    return import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
};

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
        <div className="lightbox-overlay lightbox-glass" onClick={onClose}>
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
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        auctionStore.loadAuctionDetails(id);

        const stompClient = new Client({
            // --- MODIFIED: Using the dynamic URL helper here ---
            webSocketFactory: () => new SockJS(getWebSocketUrl()),
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

// --- status flags ---
    const isActive = auction.status === 'ACTIVE';
    const isPending = auction.status === 'PENDING_APPROVAL';
    const isScheduled = auction.status === 'SCHEDULED';
    const isCancelled = auction.status === 'CANCELLED';
    const isEnded = ['SOLD', 'UNSOLD', 'CANCELLED'].includes(auction.status);

// --- cancel state helpers ---
    const cannotCancelReason =
        isActive ? "Cannot cancel active auction. Contact Support."
            : auction.bidCount > 0 ? "Cannot cancel auction with existing bids. Contact Support."
                : null;

    const isCancelDisabled = isCanceling || !!cannotCancelReason;

    const handleApprove = async () => {
        setActionLoading(true);
        await auctionStore.approveAuction(auction.id);
        setActionLoading(false);
    };

    const handleCancelAuction = async () => {
        setCancelDialogOpen(true);
    };

    const confirmCancelAuction = async () => {
        setCancelDialogOpen(false);
        setIsCanceling(true);
        await auctionStore.cancelAuction(auction.id);
        setIsCanceling(false);
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
                        
                        <div className="history-wrapper">
                            <h3 style={{ padding: '20px 24px 0 24px', margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Comments & Bids</h3>
                            <BidHistory bids={auctionStore.bidHistory} />
                        </div>
                    </div>

                    <div className="details-right">

                        {isPending && (
                            <div className="compact-banner banner-pending">
                                <strong>Pending Approval</strong>
                                <p>{isOwner ? "Under review." : "Waiting for admin."}</p>
                            </div>
                        )}

                        {isScheduled && (
                            <div className="compact-banner banner-pending">
                                <strong>Scheduled</strong>
                                <p>Starts {formatDistanceToNow(new Date(auction.startTime), { addSuffix: true })}.</p>
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
                                            if (cannotCancelReason) setShowCancelTooltip(true);
                                        }}
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
                                            {cannotCancelReason ?? ""}
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
                                            disabled={isCancelDisabled}
                                            style={{
                                                width: "100%",
                                                padding: "10px",
                                                background: "transparent",
                                                border: "none",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                cursor: isCancelDisabled ? "not-allowed" : "pointer",
                                                opacity: isCancelDisabled ? 0.5 : 1,
                                                pointerEvents: isCancelDisabled ? "none" : "auto"
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
                                    {isPending && "Pending Approval"}
                                    {isScheduled && "Scheduled"}
                                    {isCancelled && "Cancelled"}
                                    {isEnded && !isCancelled && `Auction ${auction.status}`}
                                </h4>

                                {isPending && <span className="text-small">Waiting for admin approval</span>}

                                {isScheduled && (
                                    <span className="text-small">
            Starts {formatDistanceToNow(new Date(auction.startTime), { addSuffix: true })}
        </span>
                                )}

                                {isEnded && (
                                    <span className="text-small">
            Ended {formatDistanceToNow(new Date(auction.endTime))} ago
        </span>
                                )}
                            </div>
                        )}

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

            <ConfirmDialog
                isOpen={cancelDialogOpen}
                title="Cancel Auction"
                message="Are you sure you want to cancel this auction? The vehicle will be returned to your garage as a draft."
                onConfirm={confirmCancelAuction}
                onCancel={() => setCancelDialogOpen(false)}
                confirmLabel="Cancel Auction"
                isDestructive={true}
            />
        </DetailPageLayout>
    );
});

const StatusBadge = ({ status, isNoReserve }: { status: string, isNoReserve: boolean }) => {
    let className = "badge-base ";
    switch (status) {
        case 'ACTIVE': className += "badge-active"; break;
        case 'PENDING_APPROVAL': className += "badge-pending"; break;
        case 'SCHEDULED': className += "badge-pending"; break; // or badge-scheduled
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