import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import {
    Clock,
    AlertCircle,
    Trophy,
    Trash2,
    Edit3,
} from "lucide-react";
import { useStore } from "../../shared/hooks/useStore.ts";
import { DetailPageLayout, DetailSkeleton, VehicleHeader, ImageGallery, VehicleInfo } from "../../shared/ui/details";
import { CreateAuctionModal } from "../../features/auction/ui/CreateAuctionModal.tsx";
import { BidHistoryList } from "../../features/bid/ui/BidHistoryList.tsx";
import type { CreateAuctionDto } from "../../features/auction/types.ts";
import { ConfirmDialog } from "../../shared/ui/dialog/ConfirmDialog";
import { adminApi } from "../../features/admin/api/admin.api";
import "./AuctionDetails.css";

const StatusBadge = ({ status }: { status: string }) => {
    let className = "badge-base ";
    let label = status.replace('_', ' ');

    switch (status) {
        case 'ACTIVE_AUCTION':
        case 'ACTIVE':
            className += "badge-active";
            label = "ACTIVE AUCTION";
            break;
        case 'PENDING_AUCTION':
        case 'PENDING_APPROVAL':
            className += "badge-pending";
            label = "PENDING APPROVAL";
            break;
        case 'LISTED_AUCTION':
        case 'SCHEDULED':
            className += "badge-pending";
            label = "SCHEDULED";
            break;
        case 'DRAFT':
            className += "badge-ended";
            label = "DRAFT";
            break;
        case 'UNSOLD':
            className += "badge-ended";
            label = "UNSOLD";
            break;
        case 'SOLD':
            className += "badge-sold";
            label = "SOLD";
            break;
        case 'REJECTED':
        case 'CANCELLED':
            className += "badge-rejected";
            label = "REJECTED";
            break;
        default:
            className += "badge-ended";
            break;
    }

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <span className={className}>{label}</span>
        </div>
    );
};


 
export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            itemStore.loadItemDetails(id).then(() => {
                const targetAuctionId = itemStore.selectedItem?.auctionId || itemStore.selectedItem?.auction?.id;
                if (targetAuctionId) {
                    auctionStore.loadAuctionDetails(targetAuctionId);
                }
            });
        }
        return () => {
            itemStore.clearSelectedItem();
            auctionStore.clearSelectedAuction();
        };
    }, [id, itemStore, auctionStore]);

    const handleCreateAuction = async (data: CreateAuctionDto) => {
        const success = await auctionStore.startAuction(data);
        if (success) {
            setIsListModalOpen(false);
            if (auctionStore.currentAuction) {
                if (auctionStore.currentAuction.status === 'PENDING_APPROVAL') {
                    await itemStore.loadItemDetails(id!);
                } else {
                    navigate(`/auctions/${auctionStore.currentAuction.id}`);
                }
            }
        }
    };

    const handleDeleteItem = async () => {
        if (!id) return;
        setDeleteDialogOpen(true);
    };

    const handleApprove = async () => {
        setApproveDialogOpen(true);
    };

    const confirmApprove = async () => {
        const targetAuctionId = itemStore.selectedItem?.auctionId || itemStore.selectedItem?.auction?.id || auctionStore.currentAuction?.id;
        if (!targetAuctionId) return;
        setApproveDialogOpen(false);
        setActionLoading(true);
        const success = await auctionStore.approveAuction(targetAuctionId);
        setActionLoading(false);
        if (success) {
            navigate('/admin');
        }
    };

    const handleReject = async () => {
        setRejectDialogOpen(true);
    };

    const confirmReject = async () => {
        const targetAuctionId = itemStore.selectedItem?.auctionId || itemStore.selectedItem?.auction?.id || auctionStore.currentAuction?.id;
        if (!targetAuctionId) return;
        setRejectDialogOpen(false);
        setActionLoading(true);
        const success = await auctionStore.adminCancelAuction(targetAuctionId);
        setActionLoading(false);
        if (success) {
            navigate('/admin');
        }
    };

    const confirmDeleteItem = async () => {
        if (!id) return;
        setDeleteDialogOpen(false);
        setIsDeleting(true);
        await itemStore.deleteListing(id);
        if (!itemStore.error) {
            navigate("/profile");
        } else {
            setIsDeleting(false);
        }
    };

    if (itemStore.isLoading && !isDeleting) {
        return <DetailSkeleton />;
    }

    if (!itemStore.selectedItem) {
        return (
            <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-primary)' }}>
                <h3>Item not found.</h3>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ 
                        marginTop: '1rem', 
                        padding: '12px 24px', 
                        background: 'var(--btn-secondary-bg)', 
                        color: 'var(--btn-secondary-text)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 4, 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                    }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    const item = itemStore.selectedItem;
    const isOwner = authStore.user?.id?.toString() === item.seller?.id?.toString();
    const isAdmin = authStore.user?.roles?.some((r: { name: string }) => r.name === 'ADMIN');
    const isDraft = item.status === 'DRAFT';
    const isUnsold = item.status === 'UNSOLD';
    const isPending = item.status === 'PENDING_AUCTION';
    const isScheduled = item.status === 'LISTED_AUCTION';
    const isActiveAuction = item.status === 'ACTIVE_AUCTION';
    const isSold = item.status === 'SOLD';
    const isRejected = item.status === 'REJECTED';

    const targetAuctionId = item.auctionId || item.auction?.id || auctionStore.currentAuction?.id;
    const isGhostPending = isPending && !targetAuctionId;
    const canList = isDraft || isUnsold || isGhostPending || isRejected;
    const soldPrice = item.auction?.currentPrice;

    const getStatusText = () => {
        if (isActiveAuction) return "Active Auction";
        if (isScheduled) return "Scheduled";
        if (isGhostPending) return "Draft (Garage)";
        if (isPending) return "Needs Admin Approval";
        if (isRejected) return "Submission Rejected";
        if (isUnsold) return "Returned to Garage";
        if (isSold) return "Vehicle Sold";
        return "Draft (Garage)";
    };

    const getPriceLabel = () => {
        if (isSold) return "Sold Price";
        if (isActiveAuction) return "Current Bid";
        if (item.auction?.startPrice) return "Starting Bid";
        return "Estimated Price";
    };

    const getPriceValue = () => {
        if (isSold && soldPrice !== undefined) return `$${soldPrice.toLocaleString()}`;
        if (item.auction?.currentPrice) return `$${item.auction.currentPrice.toLocaleString()}`;
        if (item.auction?.startPrice) return `$${item.auction.startPrice.toLocaleString()}`;
        return "—";
    };

    return (
        <DetailPageLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
                    <div className="auction-layout-container">
                        {/* Left Column: Gallery & Vehicle Info */}
                        <div className="gallery-section">
                            <ImageGallery
                                item={item}
                                statusLabel={<StatusBadge status={item.status} />}
                            />
                        </div>

                        <div className="auction-main-content">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {item.rejectionReason && (
                                    <div
                                        style={{
                                            padding: "16px 20px",
                                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(239, 68, 68, 0.25)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 700, fontSize: "14px" }}>
                                            <AlertCircle size={16} /> Admin Rejection Notice
                                        </div>
                                        <span style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                                            {item.rejectionReason}
                                        </span>
                                    </div>
                                )}

                                <VehicleInfo item={item} hideHeader={true} isNoReserve={item.auction?.isNoReserve} />
                            </div>
                        </div>

                        {/* Right Column: Vehicle Header, Item Action Sidebar & Bid History */}
                        <div className="auction-sidebar">
                            <div className="vehicle-header-wrapper">
                                <VehicleHeader item={item} />
                            </div>

                            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1, minHeight: 0 }}>
                                {/* Action Card matching BiddingCard */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "100%",
                                        height: "100%",
                                        flexGrow: 1,
                                        justifyContent: "space-between",
                                        gap: "16px",
                                    }}
                                >
                                    {/* Meta Row: Status & Reserve Indicator */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingBottom: "14px",
                                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Clock size={18} style={{ color: "var(--text-muted)" }} />
                                            <span style={{ fontSize: "15px", color: "var(--text-muted)", fontWeight: 500 }}>Listing Status</span>
                                            <span
                                                style={{
                                                    fontSize: "17px",
                                                    fontWeight: 800,
                                                    color: isSold ? "#4ade80" : isRejected ? "#ef4444" : "var(--text-primary)",
                                                    marginLeft: "4px",
                                                }}
                                            >
                                                {getStatusText()}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {item.auction?.isNoReserve ? (
                                                <span
                                                    style={{
                                                        padding: "3px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase",
                                                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                                                        color: "#4ade80",
                                                        border: "1px solid rgba(34, 197, 94, 0.3)",
                                                    }}
                                                >
                                                    No Reserve
                                                </span>
                                            ) : item.auction?.reservePrice ? (
                                                <span
                                                    style={{
                                                        padding: "3px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase",
                                                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                                                        color: "#f59e0b",
                                                        border: "1px solid rgba(245, 158, 11, 0.3)",
                                                    }}
                                                >
                                                    Reserve Set
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        padding: "3px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase",
                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                        color: "var(--text-muted)",
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                    }}
                                                >
                                                    Garage Lot
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & Context Info */}
                                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: "4px" }}>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: "var(--text-muted)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                            }}
                                        >
                                            {getPriceLabel()}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "48px",
                                                fontWeight: 800,
                                                color: "var(--text-primary)",
                                                lineHeight: 1.05,
                                                letterSpacing: "-0.03em",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {getPriceValue()}
                                        </span>

                                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginTop: "2px" }}>
                                            {isSold
                                                ? "Auction completed • Sold to the highest bidder."
                                                : isActiveAuction
                                                ? "Auction is currently active and accepting live bids."
                                                : isPending
                                                ? "Under admin review. You will be notified once scheduled."
                                                : isScheduled
                                                ? "Approved for auction and awaiting scheduled start date."
                                                : isRejected
                                                ? "Submission was rejected by administrator."
                                                : isUnsold
                                                ? "Returned to garage. Ready for revision or relisting."
                                                : "Saved in your garage inventory."}
                                        </span>

                                        {/* Status Notice Banners */}
                                        {isSold && (
                                            <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.4 }}>
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        padding: "8px 14px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                                                        border: "1px solid rgba(34, 197, 94, 0.25)",
                                                        color: "#4ade80",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Trophy size={16} /> Vehicle successfully sold at auction.
                                                </div>
                                            </div>
                                        )}

                                        {isPending && !isGhostPending && (
                                            <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.4 }}>
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        padding: "8px 14px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                                                        border: "1px solid rgba(245, 158, 11, 0.25)",
                                                        color: "#f59e0b",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <Clock size={16} /> Under review. Admin decision pending.
                                                </div>
                                            </div>
                                        )}

                                        {isRejected && (
                                            <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.4 }}>
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        padding: "8px 14px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                                                        border: "1px solid rgba(239, 68, 68, 0.25)",
                                                        color: "#ef4444",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <AlertCircle size={16} /> Submission rejected.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                                        {itemStore.error && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontSize: "13px",
                                                    color: "#fca5a5",
                                                    backgroundColor: "rgba(153, 27, 27, 0.25)",
                                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                                    borderRadius: "8px",
                                                    padding: "10px 14px",
                                                }}
                                            >
                                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                                <span>{itemStore.error}</span>
                                            </div>
                                        )}

                                        {(isActiveAuction || isScheduled || (isPending && !isGhostPending)) && (
                                            <button
                                                className="btn-place-bid"
                                                onClick={() => {
                                                    if (targetAuctionId) navigate(`/auctions/${targetAuctionId}`);
                                                }}
                                                style={{
                                                    height: "52px",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                {isPending ? "View Submitted Auction" : "View Live Auction"}
                                            </button>
                                        )}

                                        {isOwner && canList && (
                                            <>
                                                <button
                                                    className="btn-place-bid"
                                                    onClick={() => setIsListModalOpen(true)}
                                                    style={{
                                                        height: "52px",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    List for Auction
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/items/${item.id}/edit`)}
                                                    style={{
                                                        width: "100%",
                                                        height: "46px",
                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                        color: "var(--text-primary)",
                                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                                        borderRadius: "10px",
                                                        fontWeight: 600,
                                                        fontSize: "14px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "8px",
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    <Edit3 size={16} /> Edit Details & Specs
                                                </button>
                                                <button
                                                    onClick={handleDeleteItem}
                                                    disabled={isDeleting}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        background: "transparent",
                                                        border: "none",
                                                        color: "var(--color-danger-text, #ef4444)",
                                                        cursor: isDeleting ? "not-allowed" : "pointer",
                                                        fontSize: "13px",
                                                        fontWeight: 600,
                                                        opacity: isDeleting ? 0.5 : 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <Trash2 size={14} /> {isDeleting ? "Deleting..." : "Delete Listing"}
                                                </button>
                                            </>
                                        )}

                                        {isAdmin && isPending && !isGhostPending && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "10px",
                                                    marginTop: "8px",
                                                    padding: "16px",
                                                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                                    borderRadius: "10px",
                                                }}
                                            >
                                                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                                    Admin Actions
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                                    <button
                                                        onClick={handleApprove}
                                                        disabled={actionLoading}
                                                        style={{
                                                            padding: "12px",
                                                            borderRadius: "8px",
                                                            border: "none",
                                                            backgroundColor: "#10b981",
                                                            color: "#ffffff",
                                                            fontWeight: 700,
                                                            fontSize: "14px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        {actionLoading ? "Processing..." : "✓ Approve"}
                                                    </button>
                                                    <button
                                                        onClick={handleReject}
                                                        disabled={actionLoading}
                                                        style={{
                                                            padding: "12px",
                                                            borderRadius: "8px",
                                                            border: "1px solid rgba(239, 68, 68, 0.4)",
                                                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                                                            color: "#ef4444",
                                                            fontWeight: 700,
                                                            fontSize: "14px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        {actionLoading ? "Processing..." : "✗ Reject"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {isAdmin && isPending && isGhostPending && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "8px",
                                                    marginTop: "8px",
                                                    padding: "14px",
                                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                                    borderRadius: "10px",
                                                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                                                }}
                                            >
                                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#ef4444", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                    Ghost Item Detected
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm("Are you sure you want to reset this item to DRAFT?")) {
                                                            setActionLoading(true);
                                                            try {
                                                                await adminApi.resetGhostItem(item.id);
                                                                await itemStore.loadItemDetails(item.id);
                                                            } finally {
                                                                setActionLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: "12px",
                                                        backgroundColor: "#ef4444",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {actionLoading ? "Processing..." : "Reset to Draft"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bid History if bids exist */}
                                {auctionStore.bidHistory && auctionStore.bidHistory.length > 0 && (
                                    <BidHistoryList
                                        bids={auctionStore.bidHistory}
                                        isEnded={isSold || isUnsold}
                                        isSold={isSold}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            <CreateAuctionModal
                key={isListModalOpen ? "open" : "closed"}
                item={item}
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                onSubmit={handleCreateAuction}
                isLoading={auctionStore.isLoading}
                error={auctionStore.error}
            />

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                title="Delete Listing"
                message="Are you sure you want to permanently delete this listing? This cannot be undone."
                onConfirm={confirmDeleteItem}
                onCancel={() => setDeleteDialogOpen(false)}
                confirmLabel="Delete"
                isDestructive={true}
            />

            <ConfirmDialog
                isOpen={approveDialogOpen}
                title="Approve Listing"
                message="Are you sure you want to approve this listing? It will immediately become active and public for bidding."
                onConfirm={confirmApprove}
                onCancel={() => setApproveDialogOpen(false)}
                confirmLabel="Approve Listing"
                isDestructive={false}
            />

            <ConfirmDialog
                isOpen={rejectDialogOpen}
                title="Reject Listing"
                message="Are you sure you want to completely reject and cancel this listing? This action cannot be undone."
                onConfirm={confirmReject}
                onCancel={() => setRejectDialogOpen(false)}
                confirmLabel="Reject Listing"
                isDestructive={true}
            />
        </DetailPageLayout>
    );
});
