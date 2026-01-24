import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { itemStore } from "../features/item/model/item.store";
import { auctionStore } from "../features/auction/model/auction.store";

import { EditItemModal } from "../features/item/ui/EditItemModal";
import { CreateAuctionModal } from "../features/auction/ui/CreateAuctionModal";
import type { ItemDto, ItemCreateRequest } from "../features/item/types";
import type { CreateAuctionDto } from "../features/auction/types";
import { MyListingsSection } from "../features/profile/ui/MyListingsSection";
import { ProfileInfoSection } from "../features/profile/ui/ProfileInfoCard";
import { ProfileSettingsModal } from "../features/profile/ui/ProfileSettingsModal";

export const ProfilePage = observer(() => {
    const { profileStore } = useStore();
    const navigate = useNavigate();

    // --- State ---
    const [editingItem, setEditingItem] = useState<ItemDto | null>(null);
    const [auctioningItem, setAuctioningItem] = useState<ItemDto | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        profileStore.loadProfile();
        itemStore.loadMyItems();
        return () => profileStore.clearMessages();
    }, [profileStore]);

    // --- Handlers ---

    const handleAccountDelete = async (password: string) => {
        await profileStore.deleteAccount(password);
        navigate("/login");
    };

    const handleItemUpdate = async (data: ItemCreateRequest, files: File[]) => {
        if (!editingItem) return;
        const success = await itemStore.updateListing(editingItem.id, data, files);
        if (success) setEditingItem(null);
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!editingItem) return;
        await itemStore.deleteImage(editingItem.id, imageId);
    };

    const handleCreateAuction = async (data: CreateAuctionDto) => {
        const success = await auctionStore.startAuction(data);
        if (success) {
            setAuctioningItem(null);

            // Navigate to the new auction.
            // Since our store unshifts the new auction to index 0, this works.
            const newAuctionId = auctionStore.auctions[0]?.id;
            if (newAuctionId) {
                navigate(`/auctions/${newAuctionId}`);
            } else {
                // Fallback if local state update lags
                navigate("/auctions");
            }
        }
    };

    if (profileStore.isLoading && !profileStore.profile)
        return <div style={{ padding: 40, textAlign: "center", fontSize: 14 }}>Loading...</div>;

    if (!profileStore.profile)
        return <div style={{ padding: 40 }}>No profile found.</div>;

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>

            <ProfileInfoSection
                profile={profileStore.profile}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <MyListingsSection
                items={itemStore.myItems}
                isLoading={itemStore.isLoading}
                onCreate={() => navigate("/sell-car/submit")}
                onEdit={setEditingItem}
                onAuction={setAuctioningItem}
                onDelete={(id) => {
                    if (window.confirm("Delete listing?")) itemStore.deleteListing(id);
                }}
            />

            <ProfileSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onDeleteAccount={handleAccountDelete}
            />

            <EditItemModal
                isOpen={!!editingItem}
                item={editingItem}
                onClose={() => setEditingItem(null)}
                onSubmit={handleItemUpdate}
                onDeleteImage={handleDeleteImage}
                isLoading={itemStore.isLoading}
            />

            <CreateAuctionModal
                key={auctioningItem ? auctioningItem.id : "empty"}
                error={auctionStore.error}
                isOpen={!!auctioningItem}
                item={auctioningItem}
                onClose={() => setAuctioningItem(null)}
                onSubmit={handleCreateAuction}
                isLoading={auctionStore.isLoading}
            />
        </div>
    );
});