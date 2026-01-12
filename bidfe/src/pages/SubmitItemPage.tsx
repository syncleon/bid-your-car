import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { itemStore } from "../features/item/model/item.store";
import { SubmitItemForm } from "../features/item/ui/SubmitItemForm";

export const SubmitItemPage = observer(() => {
    const navigate = useNavigate();

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
                onSubmit={async (data, files) => { if (await itemStore.submitItem(data, files)) navigate("/"); }}
                isLoading={itemStore.isLoading}
            />
        </div>
    );
});