import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";

export const AdminDashboardPage = observer(() => {
    const { authStore } = useStore();

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Welcome, {authStore.user?.username}!</h2>
                <p>Use the sidebar to navigate the admin panel.</p>
                <ul style={{ marginTop: '20px', lineHeight: '1.6' }}>
                    <li><strong>Users:</strong> Deactivate accounts.</li>
                    <li><strong>Auctions:</strong> Approve pending listings or force cancel active ones.</li>
                </ul>
            </div>
        </div>
    );
});
