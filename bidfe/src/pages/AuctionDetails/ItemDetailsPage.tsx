import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../shared/hooks/useStore.ts";
import { DetailPageLayout, DetailSkeleton, VehicleHeader, ResponsiveGrid, DetailHeader, ImageGallery, VehicleInfo } from "../../shared/ui/details";
import { CreateAuctionModal } from "../../features/auction/ui/CreateAuctionModal.tsx";
import { InlineItemEditor } from "../../features/item/ui/InlineItemEditor";
import type { CreateAuctionDto } from "../../features/auction/types.ts";
import type { ItemImageDto } from "../../features/item/types.ts";
import { ConfirmDialog } from "../../shared/ui/dialog/ConfirmDialog";
import { adminApi } from "../../features/admin/api/admin.api";
import "./AuctionDetails.css";



const pageStyles = {
    statusBox: { background: "var(--bg-input)", padding: 16, borderRadius: 4, textAlign: "center" as const, color: "var(--text-secondary)", fontWeight: 500, transition: "background-color 0.3s ease, color 0.3s ease" },
    pricingBox: { marginTop: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", borderRadius: 4, border: "1px solid var(--border-color)", transition: "all 0.3s ease" },
    pricingLabel: { fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, margin: 0, transition: "color 0.3s ease" },
    btnPrimary: { width: "100%", padding: "12px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" },
    btnSecondary: { width: "100%", padding: "12px", background: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)", border: "1px solid var(--border-color)", borderRadius: 4, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" },
    btnTextDestructive: { width: "100%", padding: "8px", background: "transparent", border: "none", color: "var(--color-danger-text)", cursor: "pointer", fontSize: 13, transition: "color 0.3s ease" },
    zoomHint: { textAlign: "center" as const, fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", cursor: "pointer", transition: "color 0.3s ease" },
    errorBox: { padding: "12px", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", textAlign: "center" as const, fontWeight: 500 }
};

const lightboxStyles = {
    overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" },
    content: { position: "relative" as const, maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", outline: "none" },
    image: { maxWidth: "100%", maxHeight: "90vh", borderRadius: "6px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", userSelect: "none" as const },
    closeBtn: { position: "fixed" as const, top: "24px", right: "24px", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer", zIndex: 1000, width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.2s" },
    prevBtn: { position: "fixed" as const, left: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer", padding: "0", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", transition: "background 0.2s" },
    nextBtn: { position: "fixed" as const, right: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer", padding: "0", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", transition: "background 0.2s" },
    counter: { position: "fixed" as const, bottom: "24px", left: "50%", transform: "translateX(-50%)", color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", fontWeight: 500, background: "rgba(0, 0, 0, 0.5)", padding: "4px 12px", borderRadius: "6px", backdropFilter: "blur(4px)" }
};

const Lightbox = ({ images, initialIndex, onClose }: { images: ItemImageDto[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex || 0);

    const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); if (images?.length) setIndex((prev) => (prev + 1) % images.length); };
    const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); if (images?.length) setIndex((prev) => (prev - 1 + images.length) % images.length); };

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
    return (
        <div style={lightboxStyles.overlay} onClick={onClose}>
            <button style={lightboxStyles.closeBtn}>✕</button>
            {images.length > 1 && (
                <>
                    <button style={lightboxStyles.prevBtn} onClick={handlePrev}>‹</button>
                    <button style={lightboxStyles.nextBtn} onClick={handleNext}>›</button>
                    <div style={lightboxStyles.counter}>{index + 1} / {images.length}</div>
                </>
            )}
            <div style={lightboxStyles.content} onClick={(e) => e.stopPropagation()}>
                {images[index]?.url && <img src={images[index].url} alt="Vehicle" style={lightboxStyles.image} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/600x400/eeeeee/999999?text=Image+Not+Found'; }} />}
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) itemStore.loadItemDetails(id);
        return () => itemStore.clearSelectedItem();
    }, [id, itemStore]);

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
                <button onClick={() => navigate(-1)} style={{ ...pageStyles.btnSecondary, width: 'auto', marginTop: '1rem' }}>
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
        if (isScheduled) return "Scheduled for Auction";
        if (isGhostPending) return "Garage Inventory (Draft)";
        if (isPending) return "Needs Admin Approval";
        if (isRejected) return "Your Submission Rejected";
        if (isUnsold) return "Unsold / Returned to Garage";
        return "Garage Inventory (Draft)";
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate('/garage')} title="Back to Garage" />

            <ResponsiveGrid hasSidebar={false}>
                {/* Single Column matching Auction Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="vehicle-header-wrapper" style={{ marginTop: '0', paddingTop: '0', marginBottom: '0' }}>
                        <VehicleHeader item={item} />
                    </div>

                    {isEditing ? (
                        <InlineItemEditor 
                            item={item} 
                            onCancel={() => setIsEditing(false)} 
                            onSaveSuccess={() => {
                                setIsEditing(false);
                                itemStore.loadItemDetails(item.id);
                            }} 
                        />
                    ) : (
                        <>
                            <div className="gallery-wrapper">
                                <ImageGallery
                                    item={item}
                                    statusLabel={
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span className="badge-ended">AUCTION PREVIEW</span>
                                        </div>
                                    }
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '70fr 30fr', gap: '24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{
                                        backgroundColor: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        padding: '24px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                                            {/* Left Side: Status & Details */}
                                            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>
                                                        Listing Status
                                                    </div>
                                                    <div style={{ fontSize: '24px', fontWeight: 800, color: isSold ? 'var(--color-danger-text)' : 'var(--text-primary)' }}>
                                                        {isSold ? 'Vehicle Sold' : getStatusText()}
                                                    </div>
                                                    {isSold && soldPrice !== undefined && (
                                                        <div style={{ fontSize: '18px', marginTop: '4px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                            ${soldPrice.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>

                                                {item.auction && (
                                                    <div style={{ display: 'flex', gap: '32px', backgroundColor: 'var(--bg-input)', padding: '16px 20px', borderRadius: '6px', width: 'fit-content' }}>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Start Price</div>
                                                            <div style={{ fontWeight: 600, fontSize: '16px' }}>{item.auction.startPrice ? `$${item.auction.startPrice.toLocaleString()}` : "Not set"}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reserve Price</div>
                                                            <div style={{ fontWeight: 600, fontSize: '16px', color: item.auction.isNoReserve ? 'var(--color-success-text)' : 'inherit' }}>
                                                                {item.auction.isNoReserve ? 'No Reserve' : (item.auction.reservePrice ? `$${item.auction.reservePrice.toLocaleString()}` : "Not set")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {item.rejectionReason && (
                                                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                        <strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-danger-text)' }}>Admin Message:</strong>
                                                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{item.rejectionReason}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Side: Actions */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '240px' }}>
                                                {(isActiveAuction || isScheduled || (isPending && !isGhostPending)) && (
                                                    <button onClick={() => {
                                                        const targetAuctionId = item.auctionId || item.auction?.id || auctionStore.currentAuction?.id;
                                                        if (targetAuctionId) navigate(`/auctions/${targetAuctionId}`);
                                                    }} style={{ ...pageStyles.btnPrimary, backgroundColor: 'var(--color-primary)' }}>
                                                        {isPending ? "View Submitted Auction" : "View Live Auction"}
                                                    </button>
                                                )}

                                                {isOwner && canList && (
                                                    <>
                                                        <button onClick={() => setIsListModalOpen(true)} style={{ ...pageStyles.btnPrimary }}>
                                                            List for Auction
                                                        </button>
                                                        <button onClick={() => setIsEditing(true)} style={{ ...pageStyles.btnSecondary }}>
                                                            Edit Details & Specs
                                                        </button>
                                                        <button onClick={handleDeleteItem} disabled={isDeleting} style={{ ...pageStyles.btnTextDestructive, opacity: isDeleting ? 0.5 : 1 }}>
                                                            {isDeleting ? "Deleting..." : "Delete Listing"}
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {isAdmin && isPending && !isGhostPending && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>ADMIN ACTIONS</div>
                                                        <button onClick={handleApprove} disabled={actionLoading} style={{ ...pageStyles.btnPrimary, backgroundColor: '#10b981', color: '#fff' }}>
                                                            {actionLoading ? "Processing..." : "✓ Approve Listing"}
                                                        </button>
                                                        <button onClick={handleReject} disabled={actionLoading} style={{ ...pageStyles.btnPrimary, backgroundColor: '#ef4444', color: '#fff' }}>
                                                            {actionLoading ? "Processing..." : "✗ Reject Listing"}
                                                        </button>
                                                    </div>
                                                )}

                                                {isAdmin && isPending && isGhostPending && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-danger-text)', letterSpacing: '0.5px', marginBottom: '4px' }}>GHOST DETECTED</div>
                                                        <button onClick={async () => {
                                                            if (window.confirm("Are you sure you want to reset this item to DRAFT?")) {
                                                                setActionLoading(true);
                                                                try {
                                                                    await adminApi.resetGhostItem(item.id);
                                                                    await itemStore.loadItemDetails(item.id);
                                                                } finally {
                                                                    setActionLoading(false);
                                                                }
                                                            }
                                                        }} disabled={actionLoading} style={{ ...pageStyles.btnPrimary, backgroundColor: '#ef4444', color: '#fff' }}>
                                                            {actionLoading ? "Processing..." : "Reset to Draft"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {itemStore.error && <div style={{...pageStyles.errorBox, margin: 0}}>{itemStore.error}</div>}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <button style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            backgroundColor: 'var(--bg-card)', 
                                            border: '1px solid var(--border-color)', 
                                            padding: '8px 16px', 
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}>
                                            <span style={{ 
                                                backgroundColor: '#fff', 
                                                color: '#000', 
                                                padding: '2px 6px', 
                                                borderRadius: '6px', 
                                                fontWeight: 900, 
                                                letterSpacing: '1px',
                                                fontSize: '12px' 
                                            }}>CARFAX</span>
                                            Vehicle History Report
                                        </button>
                                    </div>

                                    <VehicleInfo item={item} hideHeader={true} />
                                </div>
                                
                                {/* Right Column (Empty to match AuctionDetails layout) */}
                                <div></div>
                            </div>
                        </>
                    )}
                </div>
            </ResponsiveGrid>

            <CreateAuctionModal
                key={isListModalOpen ? "open" : "closed"}
                item={item}
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                onSubmit={handleCreateAuction}
                isLoading={auctionStore.isLoading}
                error={auctionStore.error}
            />


            {lightboxIndex !== null && item.images && item.images.length > 0 && (
                <Lightbox images={item.images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}

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
