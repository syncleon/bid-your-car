import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../../shared/hooks/useStore";
import { DetailPageLayout, DetailHeader, ImageGallery, VehicleInfo, ResponsiveGrid, SidebarCard } from "../../../shared/ui/details"; // Import from step 1
import { CreateAuctionModal } from "../../auction/ui/CreateAuctionModal";
import { EditItemModal } from "../ui/EditItemModal";
import type { CreateAuctionDto } from "../../auction/types";
import type { ItemCreateRequest } from "../types";

export const ItemDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { itemStore, auctionStore, authStore } = useStore();

    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (id) itemStore.loadItemDetails(id);
        return () => itemStore.clearSelectedItem();
    }, [id, itemStore]);

    // --- Handlers ---
    const handleCreateAuction = async (data: CreateAuctionDto) => {
        const success = await auctionStore.startAuction(data);
        if (success) {
            setIsListModalOpen(false);
            if (auctionStore.currentAuction) navigate(`/auctions/${auctionStore.currentAuction.id}`);
        }
    };

    const handleItemUpdate = async (data: ItemCreateRequest, files: File[]) => {
        if (!id) return;
        const success = await itemStore.updateListing(id, data, files);
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

    if (itemStore.isLoading || !itemStore.selectedItem) return <div style={{padding:80,textAlign:'center'}}>Loading...</div>;

    const item = itemStore.selectedItem;
    const isOwner = authStore.user?.id === item.seller.id;

    // --- Status Badge Logic ---
    let statusBadge = null;
    if (item.activeAuctionId) statusBadge = <span style={badges.live}>LIVE AUCTION</span>;
    else if (item.sold) statusBadge = <span style={badges.sold}>SOLD</span>;

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate(-1)} title="Back" />

            <ResponsiveGrid>
                {/* LEFT: Shared Visuals & Info */}
                <div>
                    <ImageGallery item={item} statusLabel={statusBadge} />
                    <VehicleInfo item={item} />
                </div>

                {/* RIGHT: Management Actions */}
                <div>
                    <SidebarCard title="Status">
                        <div style={pageStyles.statusBox}>
                            {item.sold ? "Sold" : item.activeAuctionId ? "Active Auction" : "Draft / Inventory"}
                        </div>

                        {/* Owner Actions */}
                        {isOwner && !item.sold && !item.activeAuctionId && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                                <button onClick={() => setIsListModalOpen(true)} style={pageStyles.btnPrimary}>List for Auction</button>
                                <button onClick={() => setIsEditModalOpen(true)} style={pageStyles.btnSecondary}>Edit Details</button>
                                <button onClick={handleDeleteItem} style={pageStyles.btnTextDestructive}>Delete Listing</button>
                            </div>
                        )}

                        {/* If on auction, link to it */}
                        {item.activeAuctionId && (
                            <button onClick={() => navigate(`/auctions/${item.activeAuctionId}`)} style={{...pageStyles.btnPrimary, marginTop: 16}}>
                                View Live Auction
                            </button>
                        )}
                    </SidebarCard>
                </div>
            </ResponsiveGrid>

            {/* Modals */}
            <CreateAuctionModal
                item={item} isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)}
                onSubmit={handleCreateAuction} isLoading={auctionStore.isLoading} error={auctionStore.error}
            />
            <EditItemModal
                item={item} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleItemUpdate} onDeleteImage={async () => {}} isLoading={itemStore.isLoading}
            />
        </DetailPageLayout>
    );
});

// Minimal local styles matching shared look
const badges = {
    live: { background: "#16a34a", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 },
    sold: { background: "#dc2626", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }
};
const pageStyles = {
    statusBox: { background: "#f9fafb", padding: 16, borderRadius: 6, textAlign: "center" as const, color: "#666", fontWeight: 500 },
    btnPrimary: { width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnSecondary: { width: "100%", padding: "12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
    btnTextDestructive: { width: "100%", padding: "8px", background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13 }
};