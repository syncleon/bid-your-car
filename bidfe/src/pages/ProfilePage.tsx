import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import type {ItemCreateRequest, ItemDto} from "../features/item/types.ts";
import {useStore} from "../shared/hooks/useStore.ts";
import {itemStore} from "../features/item/model/item.store.ts";
import type {CreateAuctionDto} from "../features/auction/types.ts";
import {auctionStore} from "../features/auction/model/auction.store.ts";
import {ProfileInfoSection} from "../features/profile/ui/ProfileInfoCard.tsx";
import {MyListingsSection} from "../features/profile/ui/MyListingsSection.tsx";
import {ProfileSettingsModal} from "../features/profile/ui/ProfileSettingsModal.tsx";
import {EditItemModal} from "../features/item/ui/EditItemModal.tsx";
import {CreateAuctionModal} from "../features/auction/ui/CreateAuctionModal.tsx";

export const ProfilePage = observer(() => {
    const { profileStore } = useStore();
    const navigate = useNavigate();

    // --- State ---
    const [editingItem, setEditingItem] = useState<ItemDto | null>(null);
    const [auctioningItem, setAuctioningItem] = useState<ItemDto | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        profileStore.loadProfile();
        // Backend is paginated now. This loads Page 0 by default.
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
            // Refresh items to update status badge from "Available" to "Live"
            await itemStore.loadMyItems();

            // Navigate to the specific auction if we have the ID (assuming store tracks current created one)
            // Or just go to the auction list
            navigate("/auctions");
        }
    };

    const handleCancelAuction = async (itemId: string) => {
        const item = itemStore.myItems.find((i) => i.id === itemId);

        if (!item || !item.activeAuctionId) {
            alert("Error: No active auction found for this item.");
            return;
        }

        const success = await auctionStore.cancelActiveAuction(item.activeAuctionId);

        if (success) {
            // Refresh the list so the badge updates
            await itemStore.loadMyItems();
        }
    };

    if (profileStore.isLoading && !profileStore.profile)
        return <div style={{ padding: 40, textAlign: "center", fontSize: 14 }}>Loading profile...</div>;

    if (!profileStore.profile)
        return <div style={{ padding: 40 }}>No profile found. Please log in.</div>;

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
                onCancel={handleCancelAuction}
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