import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";
import type { ItemCreateRequest } from "../features/item/types";
import {useStore} from "../shared/hooks/useStore.ts";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();
    const { itemStore } = useStore(); // Access store via context

    const handleSubmit = async (data: ItemCreateRequest, files: File[]) => {
        // 1. Submit the item
        const success = await itemStore.submitItem(data, files);

        // 2. Navigate on success
        if (success) {
            // Assuming itemStore.submitItem sets 'this.selectedItem' to the new object
            if (itemStore.selectedItem?.id) {
                navigate(`/items/${itemStore.selectedItem.id}`);
            } else {
                // Fallback if ID is missing
                navigate("/profile");
            }
        }
    };

    return (
        <div style={{ padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ marginBottom: "60px", textAlign: "center" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px" }}>Sell your car</h1>
                <p style={{ color: "#666", fontSize: "16px" }}>Accurate details help you sell faster.</p>
            </div>

            {itemStore.error && (
                <div style={{ padding: "12px", color: "#D00", background: "#FFF0F0", borderRadius: "6px", marginBottom: "32px" }}>
                    {itemStore.error}
                </div>
            )}

            <SubmitItemForm
                onSubmit={handleSubmit}
                isLoading={itemStore.isLoading}
            />
        </div>
    );
});