import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";
import { itemStore } from "../features/item/model/item.store";

import { EditItemModal } from "../features/item/ui/EditItemModal";
import type { ItemDto, ItemSubmitRequest } from "../features/item/types";
import {MyListingsSection} from "../features/profile/ui/MyListingsSection.tsx";
import {ProfileInfoSection} from "../features/profile/ui/ProfileInfoCard.tsx";
import {SecuritySection} from "../features/profile/ui/SecurityCard.tsx";
import {AccountDeleteSection} from "../features/profile/ui/AccountDeleteCard.tsx";

export const ProfilePage = observer(() => {
    const { profileStore } = useStore();
    const navigate = useNavigate();
    const [editingItem, setEditingItem] = useState<ItemDto | null>(null);

    useEffect(() => {
        profileStore.loadProfile();
        itemStore.loadMyItems();
        return () => profileStore.clearMessages();
    }, [profileStore]);

    const handleAccountDelete = async (password: string) => {
        await profileStore.deleteAccount(password);
        navigate("/login");
    };

    const handleItemUpdate = async (data: ItemSubmitRequest, files: File[]) => {
        if (!editingItem) return;
        const success = await itemStore.updateListing(editingItem.id, data, files);
        if (success) setEditingItem(null);
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!editingItem) return;
        await itemStore.deleteImage(editingItem.id, imageId);
    };

    if (profileStore.isLoading && !profileStore.profile) return <div style={{ padding: 40, textAlign: "center", fontSize: 14 }}>Loading...</div>;
    if (!profileStore.profile) return <div style={{ padding: 40 }}>No profile found.</div>;

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
            <MyListingsSection
                items={itemStore.myItems}
                isLoading={itemStore.isLoading}
                onCreate={() => navigate("/sell-car/submit")}
                onEdit={setEditingItem}
                onDelete={(id) => {
                    if (window.confirm("Delete listing?")) itemStore.deleteListing(id);
                }}
            />

            <div style={settingsGridStyle}>
                <div>
                    <ProfileInfoSection profile={profileStore.profile} />
                </div>
                <div>
                    <SecuritySection />
                    <AccountDeleteSection onConfirmDelete={handleAccountDelete} />
                </div>
            </div>

            <EditItemModal
                isOpen={!!editingItem}
                item={editingItem}
                onClose={() => setEditingItem(null)}
                onSubmit={handleItemUpdate}
                onDeleteImage={handleDeleteImage}
                isLoading={itemStore.isLoading}
            />
        </div>
    );
});

const settingsGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "60px",
    marginTop: "24px"
};