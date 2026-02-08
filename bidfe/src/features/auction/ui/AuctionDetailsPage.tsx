import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo, ResponsiveGrid } from "../../../shared/ui/details";
import { BiddingCard } from "./BiddingCard";
import { BidHistory } from "./BidHistory";
import { formatDistanceToNow } from "date-fns";

// --- LIGHTBOX COMPONENT ---
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

    // Keyboard Navigation
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
        <div style={lightboxStyles.overlay} onClick={onClose}>
            <button style={lightboxStyles.closeBtn}>✕</button>

            {/* Navigation Buttons (Now Fixed to Screen, outside content wrapper) */}
            {images.length > 1 && (
                <>
                    <button style={lightboxStyles.prevBtn} onClick={handlePrev}>‹</button>
                    <button style={lightboxStyles.nextBtn} onClick={handleNext}>›</button>
                    <div style={lightboxStyles.counter}>{index + 1} / {images.length}</div>
                </>
            )}

            <div style={lightboxStyles.content} onClick={(e) => e.stopPropagation()}>
                <img src={url} alt="" style={lightboxStyles.image} />
            </div>
        </div>
    );
};

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { auctionStore, authStore } = useStore();
    const [actionLoading, setActionLoading] = useState(false);

    // --- Lightbox State ---
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
        return <div style={styles.loadingState}>Loading Auction Details...</div>;
    }

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const user = authStore.user;

    const isOwner = user?.id === item.seller.id;
    const isAdmin = user?.roles.some(r => r.name === 'ADMIN');

    // --- Status Logic ---
    const isActive = auction.status === 'ACTIVE';
    const isPending = auction.status === 'PENDING_APPROVAL';
    const isRejected = auction.status === 'REJECTED';
    const isEnded = ['SOLD', 'EXPIRED', 'CANCELLED'].includes(auction.status);

    // --- Actions ---

    const handleApprove = async () => {
        setActionLoading(true);
        await auctionStore.approveAuction(auction.id);
        setActionLoading(false);
    };

    const handleReject = async () => {
        if (!window.confirm("Reject this auction? The seller will be notified.")) return;
        setActionLoading(true);
        await auctionStore.rejectAuction(auction.id);
        navigate("/auctions");
        setActionLoading(false);
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate("/auctions")} title={item.year + " " + item.model} />

            {/* 1. Error Banner */}
            {auctionStore.error && (
                <div style={styles.errorBanner}>
                    <span>{auctionStore.error}</span>
                    <button onClick={() => auctionStore.clearError()} style={styles.closeBtn}>✕</button>
                </div>
            )}

            {/* 2. PENDING Banner */}
            {isPending && (
                <div style={styles.pendingBanner}>
                    <strong>⚠️ Pending Approval:</strong>
                    {isOwner
                        ? " Your listing is currently under review by our team."
                        : " This auction is waiting for admin approval to go live."}
                </div>
            )}

            {/* 3. REJECTED Banner */}
            {isRejected && (
                <div style={styles.rejectedBanner}>
                    <strong>⛔ Submission Rejected:</strong>
                    {isOwner
                        ? " This listing was not approved. Please check your email or contact support."
                        : " This listing was declined by an administrator."}
                </div>
            )}

            <ResponsiveGrid>
                {/* LEFT COLUMN: Visuals & Specs */}
                <div style={styles.leftColumn}>
                    {/* FIXED: Removed the wrapping div with onClick={() => setLightboxIndex(0)} */}
                    <ImageGallery
                        item={item}
                        statusLabel={<StatusBadge status={auction.status} />}
                        onImageClick={(index) => setLightboxIndex(index)}
                    />

                    {/* Hint can stay, but it doesn't need to control the click anymore */}
                    <div style={styles.zoomHint}>🔍 Click to enlarge photos</div>

                    <VehicleInfo item={item} />
                </div>

                {/* RIGHT COLUMN: Action Sidebar */}
                <div style={styles.rightColumn}>

                    {/* A. Bidding Interface (Only if Active) */}
                    {isActive ? (
                        <BiddingCard auction={auction} />
                    ) : (
                        <div style={isRejected ? styles.rejectedCard : styles.inactiveCard}>
                            <h3>
                                {isPending && "Coming Soon"}
                                {isRejected && "Submission Rejected"}
                                {isEnded && `Auction ${auction.status}`}
                            </h3>

                            {isPending && <p>Bidding opens once approved.</p>}

                            {isEnded && (
                                <p>Ended {formatDistanceToNow(new Date(auction.endTime))} ago</p>
                            )}
                        </div>
                    )}

                    {/* B. Admin Controls (Approval Flow) */}
                    {isAdmin && isPending && (
                        <div style={styles.adminPanel}>
                            <h4 style={styles.panelTitle}>Admin Actions</h4>
                            <div style={styles.btnGroup}>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    style={styles.btnApprove}
                                >
                                    {actionLoading ? "Processing..." : "✓ Approve & Publish"}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    style={styles.btnReject}
                                >
                                    {actionLoading ? "Processing..." : "✕ Reject"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* C. Bid History */}
                    <BidHistory bids={auctionStore.bidHistory} />
                </div>
            </ResponsiveGrid>

            {/* LIGHTBOX RENDER */}
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

// --- Components & Styles ---

const StatusBadge = ({ status }: { status: string }) => {
    const getStyle = () => {
        switch (status) {
            case 'ACTIVE': return styles.badgeLive;
            case 'PENDING_APPROVAL': return styles.badgePending;
            case 'REJECTED': return styles.badgeRejected; // New
            case 'SOLD': return styles.badgeSold;
            default: return styles.badgeEnded;
        }
    };
    // Clean up string: PENDING_APPROVAL -> PENDING APPROVAL
    return <span style={getStyle()}>{status.replace('_', ' ')}</span>;
};

const styles = {
    loadingState: { padding: "80px", textAlign: "center" as const, color: "#9ca3af" },

    // Layout
    leftColumn: { display: "flex", flexDirection: "column" as const, gap: "32px" },
    rightColumn: { display: "flex", flexDirection: "column" as const, gap: "24px" },

    // Corrected zoomHint margin to sit nicely under the gallery
    zoomHint: { textAlign: "center" as const, fontSize: "12px", color: "#9ca3af", marginTop: "-20px", marginBottom: "30px", position: "relative" as const, zIndex: 0 },

    // Banners
    errorBanner: { background: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between" },

    pendingBanner: {
        background: "#fffbeb", color: "#b45309", padding: "16px",
        borderRadius: "8px", marginBottom: "24px", border: "1px solid #fcd34d"
    },

    rejectedBanner: {
        background: "#fef2f2", color: "#991b1b", padding: "16px",
        borderRadius: "8px", marginBottom: "24px", border: "1px solid #fca5a5"
    },

    closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "16px" },

    // Cards
    inactiveCard: { padding: "24px", background: "#f3f4f6", borderRadius: "12px", textAlign: "center" as const, color: "#6b7280" },
    rejectedCard: { padding: "24px", background: "#fee2e2", borderRadius: "12px", textAlign: "center" as const, color: "#991b1b" },

    adminPanel: { padding: "20px", background: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd" },

    panelTitle: { fontSize: "12px", textTransform: "uppercase" as const, color: "#64748b", marginBottom: "12px", fontWeight: 700 },

    // Buttons
    btnGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
    btnApprove: { background: "#16a34a", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" },
    btnReject: { background: "#fff", color: "#dc2626", border: "1px solid #fecaca", padding: "10px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" },

    // Badges
    badgeLive: { background: "#000", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
    badgePending: { background: "#f59e0b", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
    badgeRejected: { background: "#dc2626", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
    badgeSold: { background: "#16a34a", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
    badgeEnded: { background: "#9ca3af", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 },
};

// --- UPDATED FIXED BUTTON STYLES ---
const lightboxStyles = {
    overlay: {
        position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.2s"
    },
    content: {
        position: "relative" as const, maxWidth: "90vw", maxHeight: "90vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        outline: "none"
    },
    image: {
        maxWidth: "100%",
        maxHeight: "90vh",
        borderRadius: "4px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        userSelect: "none" as const
    },
    // Fixed Close Button (Top Right)
    closeBtn: {
        position: "fixed" as const, top: "24px", right: "24px",
        background: "rgba(255, 255, 255, 0.1)",
        border: "none", color: "#fff", fontSize: "24px",
        cursor: "pointer", zIndex: 1000,
        width: "48px", height: "48px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
        transition: "background 0.2s"
    },
    // Fixed Previous Button (Left Center)
    prevBtn: {
        position: "fixed" as const, left: "24px", top: "50%", transform: "translateY(-50%)",
        background: "rgba(255, 255, 255, 0.1)",
        border: "none", color: "#fff", fontSize: "32px",
        cursor: "pointer", padding: "0",
        width: "56px", height: "56px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
        transition: "background 0.2s"
    },
    // Fixed Next Button (Right Center)
    nextBtn: {
        position: "fixed" as const, right: "24px", top: "50%", transform: "translateY(-50%)",
        background: "rgba(255, 255, 255, 0.1)",
        border: "none", color: "#fff", fontSize: "32px",
        cursor: "pointer", padding: "0",
        width: "56px", height: "56px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
        transition: "background 0.2s"
    },
    // Fixed Counter (Bottom Center)
    counter: {
        position: "fixed" as const, bottom: "24px", left: "50%", transform: "translateX(-50%)",
        color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", fontWeight: 500,
        background: "rgba(0, 0, 0, 0.5)", padding: "4px 12px", borderRadius: "20px",
        backdropFilter: "blur(4px)"
    }
};