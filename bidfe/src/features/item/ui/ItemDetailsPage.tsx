import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { minStyles } from "../../profile/ui/minimalStyles";
import type { ItemCreateRequest } from "../types";
import { EditItemModal } from "../ui/EditItemModal";
import {CreateAuctionModal} from "../../auction/ui/CreateAuctionModal.tsx";
import type {CreateAuctionDto} from "../../auction/types.ts"; // ✅ Reuse Edit Modal

export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    // ✅ Local state for modals
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
        return () => {
            itemStore.clearSelectedItem();
            auctionStore.clearSelectedAuction();
        };
    }, [id]);

    const loadData = async (itemId: string) => {
        await itemStore.loadItemDetails(itemId);
        const activeAuctionId = itemStore.selectedItem?.activeAuctionId;
        if (activeAuctionId) {
            auctionStore.loadAuctionDetails(activeAuctionId);
        }
    };

    // --- Handlers ---

    const handleCancelAuction = async () => {
        const auctionId = itemStore.selectedItem?.activeAuctionId;
        if (!auctionId) return;

        if (window.confirm("Are you sure you want to cancel this auction? This action cannot be undone.")) {
            const success = await auctionStore.cancelActiveAuction(auctionId);
            if (success) loadData(id!);
        }
    };

    const handleCreateAuction = async (data: CreateAuctionDto) => {
        const success = await auctionStore.startAuction(data);
        if (success) {
            setIsListModalOpen(false);
            await loadData(id!);
            if (auctionStore.currentAuction) {
                navigate(`/auctions/${auctionStore.currentAuction.id}`);
            }
        }
    };

    // ✅ New: Update Item Logic
    const handleItemUpdate = async (data: ItemCreateRequest, files: File[]) => {
        if (!id) return;
        const success = await itemStore.updateListing(id, data, files);
        if (success) {
            setIsEditModalOpen(false);
            await loadData(id); // Reload to show changes
        }
    };

    // ✅ New: Delete Image Logic (passed to Edit Modal)
    const handleDeleteImage = async (imageId: string) => {
        if (!id) return;
        await itemStore.deleteImage(id, imageId);
        // Store updates locally, but we can reload to be safe
        await loadData(id);
    };

    // ✅ New: Delete Item Logic
    const handleDeleteItem = async () => {
        if (!id) return;
        if (window.confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
            await itemStore.deleteListing(id);
            navigate("/profile"); // Redirect to profile after delete
        }
    };

    if (itemStore.isLoading && !itemStore.selectedItem) {
        return <div style={{ padding: 80, textAlign: "center", color: "#666" }}>Loading details...</div>;
    }

    if (!itemStore.selectedItem) {
        return (
            <div style={{ padding: 80, textAlign: "center" }}>
                <h3 style={{ color: "#dc2626" }}>Listing not found</h3>
                <button onClick={() => navigate("/")} style={minStyles.textBtn}>&larr; Return Home</button>
            </div>
        );
    }

    const item = itemStore.selectedItem;
    const auction = auctionStore.selectedAuction;
    const isOwner = authStore.user?.id === item.seller.id;
    const mainImage = item.images?.[0]?.fullHdUrl || item.images?.[0]?.originalUrl;

    const fmtMoney = (val?: number | null) => val ? `$${val.toLocaleString()}` : "—";

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => navigate(-1)} style={minStyles.textBtn}>
                    &larr; Back
                </button>
                {isOwner && (
                    <div style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>
                        OWNER VIEW
                    </div>
                )}
            </div>

            <div style={styles.grid}>
                {/* LEFT COLUMN */}
                <div style={styles.mainCol}>
                    <div style={styles.imageContainer}>
                        {mainImage ? (
                            <img src={mainImage} alt={item.model} style={styles.mainImg} />
                        ) : (
                            <div style={styles.placeholder}>No Photos</div>
                        )}
                        {item.activeAuctionId && <div style={styles.liveBadge}>● LIVE AUCTION</div>}
                        {item.sold && <div style={styles.soldBadge}>SOLD</div>}
                    </div>

                    {item.images.length > 1 && (
                        <div style={styles.thumbGrid}>
                            {item.images.slice(1, 5).map(img => (
                                <img key={img.id} src={img.thumbnailUrl} alt="Gallery" style={styles.thumb} />
                            ))}
                        </div>
                    )}

                    <h1 style={styles.title}>{item.year} {item.make} {item.model}</h1>
                    <p style={styles.subtitle}>{item.mileage.toLocaleString()} miles • {item.location}</p>
                    <div style={styles.divider} />
                    <h3 style={styles.sectionTitle}>About this Vehicle</h3>
                    <p style={styles.description}>{item.description || "No detailed description provided."}</p>
                </div>

                {/* RIGHT COLUMN */}
                <div style={styles.sidebar}>

                    {/* Case 1: Active Auction */}
                    {auction && item.activeAuctionId ? (
                        <div style={styles.card}>
                            <div style={styles.cardHeaderActive}>
                                <span style={styles.pulseDot} /> Auction in Progress
                            </div>
                            <div style={{ marginBottom: 20, textAlign: "center" }}>
                                <div style={{ fontSize: "13px", color: "#666", marginBottom: 4 }}>Current Bid</div>
                                <div style={{ fontSize: "32px", fontWeight: 800, color: "#111" }}>
                                    {fmtMoney(auction.currentHighestBid || auction.startPrice)}
                                </div>
                                <div style={{ fontSize: "13px", color: "#666", marginTop: 4 }}>
                                    {auction.bidCount} {auction.bidCount === 1 ? 'Bid' : 'Bids'}
                                </div>
                            </div>
                            <button onClick={() => navigate(`/auctions/${auction.id}`)} style={{ ...minStyles.primaryBtn, width: "100%", marginBottom: 12 }}>
                                Go to Bidding Page
                            </button>
                            {isOwner && (
                                <button onClick={handleCancelAuction} style={{ ...minStyles.secondaryBtn, width: "100%", color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}>
                                    Cancel Auction
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Case 2: Available / Draft */
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>Status</div>
                            <div style={styles.statusBox}>
                                {item.sold ? <span style={{ color: "#dc2626", fontWeight: 700 }}>SOLD</span> : <span>Currently not listed</span>}
                            </div>

                            {isOwner && !item.sold && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 16 }}>
                                    <button onClick={() => setIsListModalOpen(true)} style={minStyles.primaryBtn}>
                                        List for Auction
                                    </button>
                                    <button onClick={() => setIsEditModalOpen(true)} style={minStyles.secondaryBtn}>
                                        Edit Details
                                    </button>
                                    <button onClick={handleDeleteItem} style={{ ...minStyles.textBtn, color: "#dc2626", marginTop: 8, fontSize: "12px" }}>
                                        Delete Listing
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ ...styles.card, marginTop: 24 }}>
                        <div style={styles.specRow}><span>VIN</span><span style={styles.specValue}>{item.vin}</span></div>
                        <div style={styles.specRow}><span>Engine</span><span style={styles.specValue}>{item.engine}</span></div>
                        <div style={styles.specRow}><span>Trans</span><span style={styles.specValue}>{item.transmission}</span></div>
                        <div style={styles.specRow}><span>Ext/Int</span><span style={styles.specValue}>{item.exteriorColor}/{item.interiorColor}</span></div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateAuctionModal
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
                onDeleteImage={handleDeleteImage}
                isLoading={itemStore.isLoading}
            />
        </div>
    );
});

// --- Styles (Same as before) ---
const styles: Record<string, React.CSSProperties> = {
    container: { maxWidth: 1200, margin: "0 auto", padding: "24px" },
    grid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "40px", alignItems: "start" },
    mainCol: { minWidth: 0 },
    sidebar: { position: "sticky", top: "24px" },
    imageContainer: { width: "100%", aspectRatio: "16/10", backgroundColor: "#f3f4f6", borderRadius: "12px", overflow: "hidden", position: "relative", marginBottom: "16px" },
    mainImg: { width: "100%", height: "100%", objectFit: "cover" },
    placeholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" },
    liveBadge: { position: "absolute", top: "16px", left: "16px", backgroundColor: "#16a34a", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
    soldBadge: { position: "absolute", top: "20px", right: "20px", backgroundColor: "#dc2626", color: "#fff", padding: "8px 16px", borderRadius: "4px", fontSize: "14px", fontWeight: 800, transform: "rotate(15deg)" },
    thumbGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" },
    thumb: { width: "100%", aspectRatio: "4/3", borderRadius: "8px", objectFit: "cover", backgroundColor: "#eee" },
    title: { fontSize: "32px", fontWeight: 800, color: "#111", margin: "0 0 8px 0", lineHeight: 1.1 },
    subtitle: { fontSize: "18px", color: "#555", margin: 0 },
    divider: { height: "1px", backgroundColor: "#eee", margin: "32px 0" },
    sectionTitle: { fontSize: "20px", fontWeight: 700, marginBottom: "16px" },
    description: { fontSize: "16px", lineHeight: 1.6, color: "#333", whiteSpace: "pre-wrap" },
    card: { backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    cardHeader: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#999", marginBottom: "16px" },
    cardHeaderActive: { fontSize: "13px", fontWeight: 700, color: "#16a34a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", textTransform: "uppercase", letterSpacing: "0.5px" },
    pulseDot: { width: "8px", height: "8px", backgroundColor: "#16a34a", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.3)" },
    statusBox: { backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", textAlign: "center", color: "#666", fontSize: "14px" },
    specRow: { display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
    specValue: { fontWeight: 600, color: "#111", textAlign: "right" },
    "@media (max-width: 768px)": { grid: { gridTemplateColumns: "1fr" }, sidebar: { position: "static" } }
};