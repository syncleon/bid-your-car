import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore.ts";
import { DetailPageLayout, ImageGallery, VehicleInfo, ResponsiveGrid, SidebarCard, DetailSkeleton } from "../shared/ui/details";
import { CreateAuctionModal } from "../features/auction/ui/CreateAuctionModal.tsx";
import { EditItemModal } from "../features/item/ui/EditItemModal.tsx";
import type { CreateAuctionDto } from "../features/auction/types.ts";
import type { ItemUpdateRequest, ItemImageDto, ImageCategory } from "../features/item/types.ts";
import { ConfirmDialog } from "../shared/ui/dialog/ConfirmDialog";

const badges = {
    live: { background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    sold: { background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    pending: { background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning-border)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    scheduled: { background: "var(--bg-input)", color: "var(--accent-color)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }
};

const pageStyles = {
    statusBox: { background: "var(--bg-input)", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "var(--text-secondary)", fontWeight: 500, transition: "background-color 0.3s ease, color 0.3s ease" },
    pricingBox: { marginTop: 16, padding: 12, background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border-color)", transition: "background-color 0.3s ease, border-color 0.3s ease" },
    pricingLabel: { fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 4, transition: "color 0.3s ease" },
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
                {images[index]?.url && <img src={images[index].url} alt="Vehicle" style={lightboxStyles.image} />}
            </div>
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

    let statusBadge = null;
    if (isActiveAuction) statusBadge = <span style={badges.live}>LIVE AUCTION</span>;
    else if (isScheduled) statusBadge = <span style={badges.scheduled}>SCHEDULED</span>;
    else if (isPending) statusBadge = <span style={badges.pending}>IN REVIEW</span>;
    else if (isSold) statusBadge = <span style={badges.sold}>SOLD</span>;

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
            <ResponsiveGrid>
                <div>
                    <ImageGallery item={item} statusLabel={statusBadge} onImageClick={(index) => setLightboxIndex(index)} />
                    <VehicleInfo item={item} />
                </div>

                <div>
                    <SidebarCard title="Inventory Status">
                        {itemStore.error && <div style={pageStyles.errorBox}>{itemStore.error}</div>}

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
                                getStatusText()
                            )}
                        </div>
                       <div style={pageStyles.pricingBox}>
                            <div style={pageStyles.pricingLabel}>Pricing Strategy</div>
                            {item.isNoReserve ? (
                                <div style={{ color: 'var(--color-success-text)', fontWeight: 700 }}>No Reserve</div>
                            ) : (
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    Reserve: {item.reservePrice ? `$${item.reservePrice.toLocaleString()}` : "Not set"}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 24 }}>
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
                                    style={{ ...pageStyles.btnPrimary, marginBottom: '12px' }}
                                >
                                    {isPending ? "View Submitted Auction" : "View Live Auction"}
                                </button>
                            )}
                            {isOwner && canList && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                                            ...pageStyles.btnTextDestructive,
                                            opacity: isDeleting ? 0.5 : 1,
                                            cursor: isDeleting ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Listing"}
                                    </button>
                                </div>
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
        </DetailPageLayout>
    );
});