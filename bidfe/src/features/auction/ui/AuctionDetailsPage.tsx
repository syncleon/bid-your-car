import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo } from "../../../shared/ui/details";
import { BiddingCard } from "./BiddingCard";
import { BidHistory } from "./BidHistory";
import { formatDistanceToNow } from "date-fns";
import { EditItemModal } from "../../item/ui/EditItemModal";
import type { ItemUpdateRequest, ItemImageDto, ImageCategory } from "../../item/types";
import "./AuctionDetails.css";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client"

// --- LIGHTBOX COMPONENT ---
const Lightbox = ({ images, initialIndex, onClose }: { images: ItemImageDto[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex);

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

    const { auctionStore, authStore, itemStore } = useStore();

    const [actionLoading, setActionLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Owner Action states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- 1. Load Data & Setup WebSockets ---
    useEffect(() => {
        if (!id) return;

        // Load initial data
        auctionStore.loadAuctionDetails(id);

        // Configure WebSocket Client for Real-Time Bids
        const stompClient = new Client({
            // NOTE: Update this URL to match your backend's actual environment URL
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            // Removed the debug property here to keep the console clean
            reconnectDelay: 5000,
            onConnect: () => {
                // Subscribe to this specific auction's topic
                stompClient.subscribe(`/topic/auctions/${id}`, (message) => {
                    const notification = JSON.parse(message.body);
                    // You can also remove this console.log if you want absolute silence
                    console.log("Live update received:", notification);

                    // When a bid comes in, refresh the details to get the latest state
                    auctionStore.loadAuctionDetails(id);
                });
            },
        });

        stompClient.activate();

        // Cleanup on unmount
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

    // Safely check ownership and roles
    const isOwner = user?.id?.toString() === item.seller.id.toString();
    const isAdmin = user?.roles?.some((r: { name: string }) => r.name === 'ADMIN');

    const isActive = auction.status === 'ACTIVE';
    const isPending = auction.status === 'PENDING_APPROVAL';
    const isCancelled = auction.status === 'CANCELLED';
    const isEnded = ['SOLD', 'UNSOLD', 'CANCELLED'].includes(auction.status);

    // --- Admin Actions ---
    const handleApprove = async () => {
        setActionLoading(true);
        await auctionStore.approveAuction(auction.id);
        setActionLoading(false);
    };

    // --- Owner Handlers ---
    const handleItemUpdate = async (
        data: ItemUpdateRequest,
        newFilesWithCategories: { file: File, category: ImageCategory }[],
        deletedImageIds: string[] = []
    ) => {
        if (!item.id) return;
        const success = await itemStore.updateListing(item.id, data, newFilesWithCategories, deletedImageIds);
        if (success) {
            setIsEditModalOpen(false);
            if (id) await auctionStore.loadAuctionDetails(id);
        }
    };

    const handleDeleteItem = async () => {
        if (!item.id) return;
        if (window.confirm("Are you sure you want to permanently delete this vehicle? This will also remove the auction. This cannot be undone.")) {
            setIsDeleting(true);
            await itemStore.deleteListing(item.id);
            if (!itemStore.error) {
                navigate("/auctions");
            } else {
                setIsDeleting(false);
            }
        }
    };

    return (
        <DetailPageLayout>
            <div className="compact-container">
                <DetailHeader onBack={() => navigate("/auctions")} title={`${item.year} ${item.make} ${item.model}`} />

                <div className="details-grid">
                    {/* LEFT COLUMN: Visuals & Specs */}
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

                    {/* RIGHT COLUMN: Actions & Status */}
                    <div className="details-right">

                        {/* 1. Alerts/Banners */}
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
                        {isCancelled && (
                            <div className="compact-banner banner-rejected">
                                <strong>⛔ Cancelled</strong>
                                <p>{isOwner ? "This listing was cancelled." : "Administratively removed."}</p>
                            </div>
                        )}

                        {/* 2. Admin Controls */}
                        {isAdmin && isPending && (
                            <div className="admin-panel compact-card">
                                <div className="admin-btn-group">
                                    <button onClick={handleApprove} disabled={actionLoading} className="btn-approve">
                                        {actionLoading ? "..." : "✓ Approve"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Owner Controls */}
                        {isOwner && !isEnded && (
                            <div className="owner-panel compact-card" style={{ marginBottom: '16px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Owner Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        style={{ padding: "10px", background: "#fff", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Edit Vehicle Details
                                    </button>
                                    <button
                                        onClick={handleDeleteItem}
                                        disabled={isDeleting}
                                        style={{
                                            padding: "10px",
                                            background: "transparent",
                                            border: "none",
                                            color: "#dc2626",
                                            fontWeight: 600,
                                            cursor: isDeleting ? "not-allowed" : "pointer",
                                            opacity: isDeleting ? 0.5 : 1
                                        }}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Listing & Auction"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 4. Main Bidding Card */}
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

                        {/* 5. Bid History */}
                        <div className="history-wrapper">
                            <BidHistory bids={auctionStore.bidHistory} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <EditItemModal
                item={item}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleItemUpdate}
                isLoading={itemStore.isLoading}
            />

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

// --- STATUS BADGE COMPONENT ---
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