import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo, ResponsiveGrid, SidebarCard } from "../../../shared/ui/details";
import { CreateAuctionModal } from "../../auction/ui/CreateAuctionModal";
import { EditItemModal } from "../ui/EditItemModal";
import type { CreateAuctionDto } from "../../auction/types";
import type { ItemCreateRequest } from "../types";

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

            {/* Navigation Buttons (Now Fixed to Screen) */}
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

export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        if (id) itemStore.loadItemDetails(id);
        return () => itemStore.clearSelectedItem();
    }, [id, itemStore]);

    // --- Handlers ---
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

    const handleItemUpdate = async (data: ItemCreateRequest, newFiles: File[], deletedImageIds: string[] = []) => {
        if (!id) return;
        const success = await itemStore.updateListing(id, data, newFiles, deletedImageIds);
        if (success) {
            setIsEditModalOpen(false);
            await itemStore.loadItemDetails(id);
        }
    };

    const handleDeleteItem = async () => {
        if (window.confirm("Are you sure? This cannot be undone.")) {
            if (id) await itemStore.deleteListing(id);
            navigate("/profile");
        }
    };

    if (itemStore.isLoading || !itemStore.selectedItem) {
        return <div style={{ padding: 80, textAlign: 'center' }}>Loading...</div>;
    }

    const item = itemStore.selectedItem;
    const isOwner = authStore.user?.id === item.seller.id;
    const isPending = item.auctionStatus === 'PENDING_APPROVAL';
    const isActive = !!item.activeAuctionId;
    const isSold = item.sold;

    // Badge Logic
    let statusBadge = null;
    if (isActive) statusBadge = <span style={badges.live}>LIVE AUCTION</span>;
    else if (isSold) statusBadge = <span style={badges.sold}>SOLD</span>;
    else if (isPending) statusBadge = <span style={badges.pending}>PENDING REVIEW</span>;

    const getStatusText = () => {
        if (isSold) return "Sold";
        if (isActive) return "Active Auction";
        if (isPending) return "Pending Admin Approval";
        return "Draft / Inventory";
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate(-1)} title="Back" />

            <ResponsiveGrid>
                {/* LEFT: Shared Visuals & Info */}
                <div>
                    <ImageGallery
                        item={item}
                        statusLabel={statusBadge}
                        onImageClick={(index) => setLightboxIndex(index)}
                    />

                    <div style={pageStyles.zoomHint} onClick={() => setLightboxIndex(0)}>
                        🔍 Click to enlarge photos
                    </div>

                    <VehicleInfo item={item} />
                </div>

                {/* RIGHT: Management Actions */}
                <div>
                    <SidebarCard title="Status">
                        <div style={isPending ? pageStyles.statusBoxPending : pageStyles.statusBox}>
                            {getStatusText()}
                        </div>

                        {isOwner && (
                            <div style={{ marginTop: 20 }}>
                                {isActive && (
                                    <button onClick={() => navigate(`/auctions/${item.activeAuctionId}`)} style={pageStyles.btnPrimary}>
                                        View Live Auction
                                    </button>
                                )}
                                {isPending && (
                                    <div style={pageStyles.lockedMessage}>
                                        🔒 Listing locked for review. <br/>
                                        Editing disabled until approved.
                                    </div>
                                )}
                                {!isActive && !isSold && !isPending && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <button onClick={() => setIsListModalOpen(true)} style={pageStyles.btnPrimary}>List for Auction</button>
                                        <button onClick={() => setIsEditModalOpen(true)} style={pageStyles.btnSecondary}>Edit Details</button>
                                        <button onClick={handleDeleteItem} style={pageStyles.btnTextDestructive}>Delete Listing</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </SidebarCard>
                </div>
            </ResponsiveGrid>

            {/* Modals */}
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

            {/* Lightbox */}
            {lightboxIndex !== null && item.images && (
                <Lightbox
                    images={item.images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </DetailPageLayout>
    );
});

// Styles
const badges = {
    live: { background: "#16a34a", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    sold: { background: "#dc2626", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    pending: { background: "#f59e0b", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }
};

const pageStyles = {
    statusBox: { background: "#f9fafb", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "#666", fontWeight: 500 },
    statusBoxPending: { background: "#fffbeb", border: "1px solid #fcd34d", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "#b45309", fontWeight: 600 },
    btnPrimary: { width: "100%", padding: "12px", background: "#111", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnSecondary: { width: "100%", padding: "12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnTextDestructive: { width: "100%", padding: "8px", background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13 },
    lockedMessage: { fontSize: "13px", color: "#9ca3af", textAlign: "center" as const, lineHeight: "1.5", fontStyle: "italic", background: "#f9fafb", padding: "12px", borderRadius: "6px" },
    zoomHint: { textAlign: "center" as const, fontSize: "12px", color: "#9ca3af", marginTop: "8px", cursor: "pointer" }
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