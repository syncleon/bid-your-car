import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo, ResponsiveGrid, SidebarCard } from "../../../shared/ui/details";
import { CreateAuctionModal } from "../../auction/ui/CreateAuctionModal";
import { EditItemModal } from "../ui/EditItemModal";
import type { CreateAuctionDto } from "../../auction/types";
import type { ItemCreateRequest, ItemImageDto } from "../types";

// --- STYLES ---
const badges = {
    live: { background: "#16a34a", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    sold: { background: "#dc2626", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }
};

const pageStyles = {
    statusBox: { background: "#f9fafb", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "#666", fontWeight: 500 },
    btnPrimary: { width: "100%", padding: "12px", background: "#111", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnSecondary: { width: "100%", padding: "12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnTextDestructive: { width: "100%", padding: "8px", background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13 },
    zoomHint: { textAlign: "center" as const, fontSize: "12px", color: "#9ca3af", marginTop: "8px", cursor: "pointer" },
    errorBox: { padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", textAlign: "center" as const, fontWeight: 500 }
};

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
    counter: {
        position: "fixed" as const, bottom: "24px", left: "50%", transform: "translateX(-50%)",
        color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", fontWeight: 500,
        background: "rgba(0, 0, 0, 0.5)", padding: "4px 12px", borderRadius: "20px",
        backdropFilter: "blur(4px)"
    }
};

// --- LIGHTBOX COMPONENT ---
const Lightbox = ({ images, initialIndex, onClose }: { images: ItemImageDto[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex || 0);

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
                {url && <img src={url} alt="Vehicle" style={lightboxStyles.image} />}
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

    const handleItemUpdate = async (data: ItemCreateRequest, newFiles: File[], deletedImageIds: string[] = []) => {
        if (!id) return;
        const success = await itemStore.updateListing(id, data, newFiles, deletedImageIds);
        if (success) {
            setIsEditModalOpen(false);
            await itemStore.loadItemDetails(id);
        }
    };

    const handleDeleteItem = async () => {
        if (!id) return;
        if (window.confirm("Are you sure you want to permanently delete this listing? This cannot be undone.")) {
            setIsDeleting(true);
            await itemStore.deleteListing(id);
            if (!itemStore.error) {
                navigate("/profile");
            } else {
                setIsDeleting(false);
            }
        }
    };

    if (itemStore.isLoading && !isDeleting) {
        return <div style={{ padding: 80, textAlign: 'center' }}>Loading item details...</div>;
    }

    if (!itemStore.selectedItem) {
        return (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <h3>Item not found.</h3>
                <button onClick={() => navigate(-1)} style={{ ...pageStyles.btnSecondary, width: 'auto', marginTop: '1rem' }}>
                    Go Back
                </button>
            </div>
        );
    }

    const item = itemStore.selectedItem;

    // FIX: Loosen the strict equality check to handle string/number mismatches
    // by comparing them both as strings.
    const isOwner = authStore.user?.id?.toString() === item.seller?.id?.toString();
    // --- Simplified Status Derived Logic ---
    const isDraft = item.status === 'DRAFT';
    const isActiveAuction = item.status === 'ACTIVE_AUCTION';
    const isSold = item.status === 'SOLD';

    // Fetch the final price if the item is sold
    const soldPrice = item.auction?.currentPrice;

    // Badges
    let statusBadge = null;
    if (isActiveAuction) statusBadge = <span style={badges.live}>LIVE AUCTION</span>;
    else if (isSold) statusBadge = <span style={badges.sold}>SOLD</span>;

    // Status Text
    const getStatusText = () => {
        if (isActiveAuction) return "Active Auction";
        if (isDraft) return "Draft / Unlisted";
        return "Inventory";
    };

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate(-1)} title="Back" />

            <ResponsiveGrid>
                <div>
                    <ImageGallery item={item} statusLabel={statusBadge} onImageClick={(index) => setLightboxIndex(index)} />
                    {item.images && item.images.length > 0 && (
                        <div style={pageStyles.zoomHint} onClick={() => setLightboxIndex(0)}>🔍 Click to enlarge photos</div>
                    )}
                    <VehicleInfo item={item} />
                </div>

                <div>
                    <SidebarCard title="Status">
                        {itemStore.error && <div style={pageStyles.errorBox}>{itemStore.error}</div>}

                        <div style={pageStyles.statusBox}>
                            {/* 1. SCENARIO: SOLD */}
                            {isSold ? (
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>Item Sold</div>
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

                        <div style={{ marginTop: 20 }}>
                            {/* 2. SCENARIO: ACTIVE AUCTION */}
                            {isActiveAuction && (
                                <button
                                    onClick={() => navigate(`/auctions/${item.activeAuctionId || item.auction?.id}`)}
                                    style={{ ...pageStyles.btnPrimary, marginBottom: '12px' }}
                                >
                                    {isOwner ? "View Live Auction" : "Follow Auction"}
                                </button>
                            )}

                            {/* 3. SCENARIO: DRAFT / OWNER CONTROLS */}
                            {isOwner && isDraft && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                                    <button onClick={() => setIsListModalOpen(true)} style={pageStyles.btnPrimary}>
                                        List for Auction
                                    </button>

                                    <button onClick={() => setIsEditModalOpen(true)} style={pageStyles.btnSecondary}>
                                        Edit Details
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
        </DetailPageLayout>
    );
});