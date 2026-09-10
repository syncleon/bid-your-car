import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore.ts";
import { DetailPageLayout, DetailSkeleton, VehicleHeader, ResponsiveGrid, SidebarCard, DetailHeader } from "../shared/ui/details";
import { CreateAuctionModal } from "../features/auction/ui/CreateAuctionModal.tsx";
import { EditItemModal } from "../features/item/ui/EditItemModal.tsx";
import type { CreateAuctionDto } from "../features/auction/types.ts";
import type { ItemUpdateRequest, ItemImageDto, ImageCategory } from "../features/item/types.ts";
import { ConfirmDialog } from "../shared/ui/dialog/ConfirmDialog";
import { adminApi } from "../features/admin/api/admin.api";
import "./AuctionDetails.css";



const pageStyles = {
    statusBox: { background: "var(--bg-input)", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "var(--text-secondary)", fontWeight: 500, transition: "background-color 0.3s ease, color 0.3s ease" },
    pricingBox: { marginTop: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border-color)", transition: "all 0.3s ease" },
    pricingLabel: { fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, margin: 0, transition: "color 0.3s ease" },
    btnPrimary: { width: "100%", padding: "12px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" },
    btnSecondary: { width: "100%", padding: "12px", background: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)", border: "1px solid var(--border-color)", borderRadius: 6, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease" },
    btnTextDestructive: { width: "100%", padding: "8px", background: "transparent", border: "none", color: "var(--color-danger-text)", cursor: "pointer", fontSize: 13, transition: "color 0.3s ease" },
    zoomHint: { textAlign: "center" as const, fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", cursor: "pointer", transition: "color 0.3s ease" },
    errorBox: { padding: "12px", backgroundColor: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", textAlign: "center" as const, fontWeight: 500 }
};

const lightboxStyles = {
    overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" },
    content: { position: "relative" as const, maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", outline: "none" },
    image: { maxWidth: "100%", maxHeight: "90vh", borderRadius: "4px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", userSelect: "none" as const },
    closeBtn: { position: "fixed" as const, top: "24px", right: "24px", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer", zIndex: 1000, width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.2s" },
    prevBtn: { position: "fixed" as const, left: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer", padding: "0", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", transition: "background 0.2s" },
    nextBtn: { position: "fixed" as const, right: "24px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "#fff", fontSize: "32px", cursor: "pointer", padding: "0", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", transition: "background 0.2s" },
    counter: { position: "fixed" as const, bottom: "24px", left: "50%", transform: "translateX(-50%)", color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", fontWeight: 500, background: "rgba(0, 0, 0, 0.5)", padding: "4px 12px", borderRadius: "20px", backdropFilter: "blur(4px)" }
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

const ReviewGallery = ({ item, onImageClick }: { item: any, onImageClick?: (index: number) => void }) => {
    const images = item.images || [];
    if (!images.length) return <div style={{ height: 300, background: 'var(--bg-input)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Photos Available</div>;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {images.map((img: any, idx: number) => (
                <div 
                    key={img.id} 
                    onClick={() => onImageClick?.(idx)}
                    style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--bg-input)', cursor: 'zoom-in', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                    <img 
                        src={img.url} 
                        alt={`Review Photo ${idx + 1}`} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/600x400/eeeeee/999999?text=Image+Not+Found'; }}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {idx + 1} / {images.length}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReviewSection = ({ title, content, isWarning }: { title: string, content: React.ReactNode, isWarning?: boolean }) => {
    if (!content) return null;
    return (
        <div style={{ 
            background: isWarning ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)', 
            border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`,
            borderRadius: '12px', 
            padding: '24px', 
            marginBottom: '24px' 
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: isWarning ? 'var(--color-danger-text)' : 'var(--text-primary)' }}>{title}</h3>
            <div style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{content}</div>
        </div>
    );
};

const ReviewVehicleInfo = ({ item }: { item: any }) => {
    const specGroups = [
        { label: "VIN", value: item.vin },
        { label: "Mileage", value: item.mileage?.toLocaleString() + " miles" },
        { label: "Title Status", value: item.titleStatus || "Clean" },
        { label: "Location", value: item.location },
        { label: "Engine", value: item.engine },
        { label: "Transmission", value: item.transmission },
        { label: "Drivetrain", value: item.drivetrain },
        { label: "Body Style", value: item.bodyStyle },
        { label: "Exterior Color", value: item.exteriorColor },
        { label: "Interior Color", value: item.interiorColor },
        { label: "Seller Type", value: item.sellerType || "Private Party" },
    ];

    return (
        <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>Vehicle Details & Specs</h2>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px', 
                marginBottom: '32px' 
            }}>
                {specGroups.map((spec, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>{spec.label}</div>
                        <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>{spec.value || "—"}</div>
                    </div>
                ))}
            </div>

            <ReviewSection title="Highlights" content={item.highlights} />
            <ReviewSection title="Known Flaws" content={item.knownFlaws} isWarning={true} />
            <ReviewSection title="Recent Service History" content={item.recentServiceHistory} />
            <ReviewSection title="Other Items Included" content={item.otherItemsIncluded} />
            <ReviewSection title="Seller Notes" content={item.description} />
        </div>
    );
};

export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

    const handleItemUpdate = async (
        data: ItemUpdateRequest,
        newFilesWithCategories: { file: File, category: ImageCategory }[],
        deletedImageIds: string[] = []
    ) => {
        if (!id) return;
        const success = await itemStore.updateListing(id, data, newFilesWithCategories, deletedImageIds);
        if (success) {
            setIsEditModalOpen(false);
            await itemStore.loadItemDetails(id);
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

    const targetAuctionId = item.auctionId || item.auction?.id || auctionStore.currentAuction?.id;
    const isGhostPending = isPending && !targetAuctionId;

    const canList = isDraft || isUnsold || isGhostPending;

    const soldPrice = item.auction?.currentPrice;

    const getStatusText = () => {
        if (isActiveAuction) return "Active Auction";
        if (isScheduled) return "Scheduled for Auction";
        if (isGhostPending) return "Garage Inventory (Draft)";
        if (isPending) return "Pending Admin Approval";
        if (isUnsold) return "Unsold / Returned to Garage";
        return "Garage Inventory (Draft)";
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate(-1)} title="Back to previous page" />
            
            <ResponsiveGrid>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="vehicle-header-wrapper" style={{ marginTop: '0', paddingTop: '0', marginBottom: '0' }}>
                        <VehicleHeader item={item} />
                    </div>

                    <div className="gallery-wrapper">
                        <ReviewGallery item={item} onImageClick={(index) => setLightboxIndex(index)} />
                    </div>

                    <ReviewVehicleInfo item={item} />
                </div>

                {/* Right Column (Sidebar) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px', alignSelf: 'start' }}>
                    {itemStore.error && <div style={pageStyles.errorBox}>{itemStore.error}</div>}

                    <SidebarCard title="Listing Status">
                        <div style={pageStyles.statusBox}>
                            {isSold ? (
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-danger-text)' }}>Vehicle Sold</div>
                                    {soldPrice !== undefined && (
                                        <div style={{ fontSize: '15px', marginTop: '4px', fontWeight: 600 }}>
                                            ${soldPrice.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                    {getStatusText()}
                                </div>
                            )}
                        </div>
                        {item.auction && (
                            <div style={pageStyles.pricingBox}>
                                <div style={pageStyles.pricingLabel}>Pricing Strategy</div>
                                {item.auction.isNoReserve ? (
                                    <div style={{ color: 'var(--color-success-text)', fontWeight: 700 }}>No Reserve</div>
                                ) : (
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                        Reserve: {item.auction.reservePrice ? `$${item.auction.reservePrice.toLocaleString()}` : "Not set"}
                                    </div>
                                )}
                            </div>
                        )}
                    </SidebarCard>

                    {isAdmin && isPending && !isGhostPending && (
                        <SidebarCard title="⚡ ADMIN REVIEW REQUIRED">
                            <div className="admin-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button onClick={handleApprove} disabled={actionLoading} className="btn-approve-2025" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                    {actionLoading ? "Processing..." : "✓ Approve Listing"}
                                </button>
                                <button onClick={handleReject} disabled={actionLoading} className="btn-reject-2025" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                    {actionLoading ? "Processing..." : "✗ Reject Listing"}
                                </button>
                            </div>
                        </SidebarCard>
                    )}

                    {isAdmin && isPending && isGhostPending && (
                        <SidebarCard title="⚠️ GHOST PENDING DETECTED">
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>This item is marked as in review, but no actual auction record exists in the database. You must reset it to draft so the user can submit it again.</p>
                            <button 
                                onClick={async () => {
                                    if (window.confirm("Are you sure you want to reset this item to DRAFT?")) {
                                        setActionLoading(true);
                                        try {
                                            await adminApi.resetGhostItem(item.id);
                                            await itemStore.loadItemDetails(item.id);
                                        } catch (e) {
                                            console.error("Failed to reset ghost item", e);
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }
                                }} 
                                disabled={actionLoading} 
                                className="btn-reject-2025" 
                                style={{ padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', width: '100%' }}
                            >
                                {actionLoading ? "Processing..." : "Reset to Draft"}
                            </button>
                        </SidebarCard>
                    )}

                    <SidebarCard title="Manage Listing">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(isActiveAuction || isScheduled || (isPending && !isGhostPending)) && (
                                <button
                                    onClick={() => {
                                        const targetAuctionId = item.auctionId || item.auction?.id || auctionStore.currentAuction?.id;
                                        if (targetAuctionId) {
                                            navigate(`/auctions/${targetAuctionId}`);
                                        } else {
                                            console.error("Auction ID is missing on the item:", item);
                                        }
                                    }}
                                    style={{ ...pageStyles.btnPrimary }}
                                >
                                    {isPending ? "View Submitted Auction" : "View Live Auction"}
                                </button>
                            )}
                            
                            {isOwner && canList && (
                                <>
                                    <button onClick={() => setIsListModalOpen(true)} style={pageStyles.btnPrimary}>
                                        List for Auction
                                    </button>
                                    <button onClick={() => setIsEditModalOpen(true)} style={pageStyles.btnSecondary}>
                                        Edit Details & Specs
                                    </button>
                                    <button
                                        onClick={handleDeleteItem}
                                        disabled={isDeleting}
                                        style={{
                                            ...pageStyles.btnSecondary,
                                            border: '1px solid var(--color-danger-border)',
                                            color: 'var(--color-danger-text)',
                                            background: 'transparent',
                                            opacity: isDeleting ? 0.5 : 1,
                                            cursor: isDeleting ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Listing"}
                                    </button>
                                </>
                            )}
                        </div>
                    </SidebarCard>
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

            <EditItemModal
                item={item}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleItemUpdate}
                isLoading={itemStore.isLoading}
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