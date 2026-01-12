import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

// Stores & Hooks
import { useStore } from "../shared/hooks/useStore";
import { itemStore } from "../features/item/model/item.store";

// UI Components
import { ProfileInfoCard } from "../features/profile/ui/ProfileInfoCard";
import { SecurityCard } from "../features/profile/ui/SecurityCard";
import { AccountDeleteCard } from "../features/profile/ui/AccountDeleteCard";
import { MyListingsSection } from "../features/profile/ui/MyListingsSection";
import { EditItemModal } from "../features/item/ui/EditItemModal";

// Types
import type { ItemDto, ItemSubmitRequest } from "../features/item/types";

export const ProfilePage = observer(() => {
    const { profileStore } = useStore();
    const navigate = useNavigate();

    // State for Item Management
    const [editingItem, setEditingItem] = useState<ItemDto | null>(null);

    // Initial Load
    useEffect(() => {
        profileStore.loadProfile();
        itemStore.loadMyItems();
        return () => profileStore.clearMessages();
    }, [profileStore]);

    // Handlers
    const handleAccountDelete = async (password: string) => {
        await profileStore.deleteAccount(password);
        navigate("/login");
    };

    const handleItemDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this listing?")) {
            await itemStore.deleteListing(id);
        }
    };

    // ✅ UPDATED: Accepts 'files' as the second argument
    const handleItemUpdate = async (data: ItemSubmitRequest, files: File[]) => {
        if (!editingItem) return;

        // Pass the files to the store
        const success = await itemStore.updateListing(editingItem.id, data, files);

        if (success) {
            setEditingItem(null);
        }
    };

    // ✅ NEW: Handles deleting an image
    const handleDeleteImage = async (imageId: string) => {
        if (!editingItem) return;

        // Call the store to delete from API
        await itemStore.deleteImage(editingItem.id, imageId);
    };

    // Loading/Error Checks
    if (profileStore.isLoading && !profileStore.profile) return <div style={{padding: 24}}>Loading Profile...</div>;
    if (!profileStore.profile) return <div style={{padding: 24}}>No profile found.</div>;

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
            <h1 style={{ marginBottom: 32 }}>My Dashboard</h1>

            {/* Global Messages */}
            {profileStore.successMessage && (
                <div style={messageStyle("#e6fffa")}>{profileStore.successMessage}</div>
            )}

            {/* Top Row: Profile & Security */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
                <ProfileInfoCard profile={profileStore.profile} />
                <SecurityCard />
            </div>

            {/* My Listings */}
            <MyListingsSection
                items={itemStore.myItems}
                isLoading={itemStore.isLoading}
                onCreate={() => navigate("/sell-car/submit")}
                onEdit={setEditingItem}
                onDelete={handleItemDelete}
            />

            {/* Danger Zone */}
            <AccountDeleteCard onConfirmDelete={handleAccountDelete} />

            {/* Edit Modal */}
            <EditItemModal
                isOpen={!!editingItem}
                item={editingItem}
                onClose={() => setEditingItem(null)}
                onSubmit={handleItemUpdate}        // ✅ Updated handler
                onDeleteImage={handleDeleteImage}  // ✅ New handler connected
                isLoading={itemStore.isLoading}
            />
        </div>
    );
});

const messageStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    color: "green",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20
});