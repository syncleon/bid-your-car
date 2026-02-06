import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {useStoreContext} from "../app/providers/useStoreContext.ts";
import {useUserListings} from "../features/profile/hooks/useUserListings.ts";
import {ChangePasswordForm, EditProfileForm} from "../features/profile/ui/ProfileActions.tsx";
import {ListingCardAdapter} from "../features/profile/ui/ListingCardsAdapter.tsx";


export const ProfilePage = observer(() => {
    // 2. Access the store safely using your Context
    const { profileStore } = useStoreContext();

    // 3. Logic Hooks (Data Fetching for items)
    const { items, isLoading: itemsLoading, error: itemsError } = useUserListings();

    // 4. Local UI State for view switching
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'password'>('view');

    // 5. Lifecycle: Load Profile Data
    useEffect(() => {
        // We only load if we don't have it, or you can force reload
        if (!profileStore.profile) {
            profileStore.loadProfile();
        }
        return () => profileStore.clearMessages();
    }, [profileStore]);

    // 6. Loading Guards
    if (profileStore.isLoading && !profileStore.profile) {
        return <div style={{ padding: 20 }}>Loading Profile...</div>;
    }

    if (!profileStore.profile) {
        return <div style={{ padding: 20 }}>Access Denied or Failed to Load</div>;
    }

    // 7. Handlers
    const handleDeleteAccount = () => {
        const password = prompt("Enter password to confirm deletion:");
        if (password) {
            profileStore.deleteAccount(password);
        }
    };

    return (
        <div style={styles.container}>
            {/* Global Messages from Store */}
            {profileStore.error && (
                <div style={styles.alertError}>{profileStore.error}</div>
            )}
            {profileStore.successMessage && (
                <div style={styles.alertSuccess}>{profileStore.successMessage}</div>
            )}

            {/* Header / Profile Info */}
            <header style={styles.header}>
                <h1 style={styles.title}>My Profile</h1>

                {viewMode === 'view' && (
                    <div style={styles.infoBlock}>
                        <div style={styles.details}>
                            <p><strong>Username:</strong> {profileStore.profile.username}</p>
                            <p><strong>Email:</strong> {profileStore.profile.email}</p>
                            <p><strong>Member Since:</strong> {profileStore.profile.createDate ? new Date(profileStore.profile.createDate).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div style={styles.actions}>
                            <button style={styles.btnSecondary} onClick={() => setViewMode('edit')}>Edit Info</button>
                            <button style={styles.btnSecondary} onClick={() => setViewMode('password')}>Change Password</button>
                            <button style={{...styles.btnSecondary, ...styles.textRed}} onClick={handleDeleteAccount}>Delete Account</button>
                        </div>
                    </div>
                )}

                {viewMode === 'edit' && (
                    <EditProfileForm store={profileStore} onCancel={() => setViewMode('view')} />
                )}

                {viewMode === 'password' && (
                    <ChangePasswordForm store={profileStore} onCancel={() => setViewMode('view')} />
                )}
            </header>

            {/* Listings Section */}
            <section style={styles.listingsSection}>
                <h2 style={styles.subtitle}>My Garage</h2>

                {itemsLoading && <p style={{color: '#666'}}>Loading your listings...</p>}
                {itemsError && <p style={{ color: 'red' }}>{itemsError}</p>}

                {!itemsLoading && !itemsError && items.length === 0 && (
                    <p style={{ color: '#9ca3af' }}>You have no active listings.</p>
                )}

                <div style={styles.grid}>
                    {/* Defensive check: Ensure items is an array before mapping */}
                    {Array.isArray(items) && items.map(item => (
                        // The Adapter handles the logic of WHICH card to show
                        <ListingCardAdapter key={item.id} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
});

export default ProfilePage;

// --- Simple CSS-in-JS for this page ---
const styles = {
    container: { maxWidth: 1200, margin: "0 auto", padding: "20px", fontFamily: "system-ui, sans-serif" },
    header: { borderBottom: "1px solid #eee", paddingBottom: 20, marginBottom: 30 },
    title: { fontSize: "2rem", marginBottom: 20, fontWeight: 700 },
    subtitle: { fontSize: "1.5rem", marginBottom: 15, fontWeight: 600 },
    infoBlock: { background: "#f9fafb", padding: 24, borderRadius: 12 },
    details: { marginBottom: 20, lineHeight: "1.8", color: "#374151" },
    actions: { display: "flex", gap: 12, flexWrap: "wrap" as "wrap" },
    listingsSection: { marginTop: 20 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px", marginTop: 20 },
    alertError: { padding: 12, marginBottom: 20, background: "#fee2e2", color: "#991b1b", borderRadius: 8 },
    alertSuccess: { padding: 12, marginBottom: 20, background: "#dcfce7", color: "#166534", borderRadius: 8 },
    btnSecondary: { padding: "8px 16px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontWeight: 500, color: "#374151" },
    textRed: { color: "#dc2626", borderColor: "#fca5a5", background: "#fef2f2" }
};