import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { useStore } from "../shared/hooks/useStore";

export const ItemsPage = observer(() => {
    const { authStore } = useStore();

    return (
        <div style={{ padding: 24 }}>
            <h1>Marketplace</h1>

            <p>
                Browse items, place bids, and sell your own products.
            </p>

            {!authStore.isAuthenticated && (
                <div style={{ marginTop: 16 }}>
                    <p>
                        To place bids or add items, please{" "}
                        <Link to="/login">login or register</Link>.
                    </p>
                </div>
            )}

            {authStore.isAuthenticated && (
                <div style={{ marginTop: 16 }}>
                    <Link to="/profile">Go to profile</Link>
                </div>
            )}

            <hr style={{ margin: "24px 0" }} />

            {/* Placeholder for items list */}
            <div>
                <p>No items yet.</p>
            </div>
        </div>
    );
});