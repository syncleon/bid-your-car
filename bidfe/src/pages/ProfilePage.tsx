import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStoreContext } from "../app/providers/useStoreContext";
import { useUserListings } from "../features/profile/hooks/useUserListings";
import { ChangePasswordForm, EditProfileForm } from "../features/profile/ui/ProfileActions";
import {Link} from "react-router-dom";
import {ItemCard} from "../features/item/ui/ItemCard.tsx";

export const ProfilePage = observer(() => {
    const { profileStore } = useStoreContext();
    const { items, isLoading: itemsLoading, error: itemsError } = useUserListings();
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'password'>('view');

    useEffect(() => {
        if (!profileStore.profile) {
            profileStore.loadProfile();
        }
        return () => profileStore.clearMessages();
    }, [profileStore]);

    if (profileStore.isLoading && !profileStore.profile) {
        return <div style={styles.loader}>Loading Profile...</div>;
    }

    if (!profileStore.profile) {
        return <div style={styles.loader}>Access Denied or Failed to Load</div>;
    }

    const handleDeleteAccount = () => {
        const password = prompt("Enter password to confirm deletion:");
        if (password) {
            profileStore.deleteAccount({ password });
        }
    };

    return (
        <div style={styles.container}>
            {profileStore.error && (
                <div style={styles.alertError}>{profileStore.error}</div>
            )}
            {profileStore.successMessage && (
                <div style={styles.alertSuccess}>{profileStore.successMessage}</div>
            )}

            <header style={styles.header}>
                <h1 style={styles.title}>Account Settings</h1>

                {viewMode === 'view' && (
                    <div style={styles.infoBlock}>
                        <div style={styles.details}>
                            <p style={styles.detailRow}>
                                <span style={styles.label}>Username</span>
                                <span style={styles.value}>{profileStore.profile.username}</span>
                            </p>
                            <p style={styles.detailRow}>
                                <span style={styles.label}>Email Address</span>
                                <span style={styles.value}>{profileStore.profile.email}</span>
                            </p>
                            <p style={styles.detailRow}>
                                <span style={styles.label}>Member Since</span>
                                <span style={styles.value}>
                                    {profileStore.profile.createdDate
                                        ? new Date(profileStore.profile.createdDate).toLocaleDateString()
                                        : "N/A"}
                                </span>
                            </p>
                        </div>
                        <div style={styles.actions}>
                            <button style={styles.btnSecondary} onClick={() => setViewMode('edit')}>Edit Profile</button>
                            <button style={styles.btnSecondary} onClick={() => setViewMode('password')}>Update Password</button>
                            <button style={styles.btnDanger} onClick={handleDeleteAccount}>Deactivate Account</button>
                        </div>
                    </div>
                )}

                {viewMode === 'edit' && (
                    <div style={styles.formWrapper}>
                        <h2 style={styles.formTitle}>Edit Profile Info</h2>
                        <EditProfileForm store={profileStore} onCancel={() => setViewMode('view')} />
                    </div>
                )}

                {viewMode === 'password' && (
                    <div style={styles.formWrapper}>
                        <h2 style={styles.formTitle}>Change Password</h2>
                        <ChangePasswordForm store={profileStore} onCancel={() => setViewMode('view')} />
                    </div>
                )}
            </header>

            <section style={styles.listingsSection}>
                <h2 style={styles.subtitle}>My Garage</h2>

                {itemsLoading && <p style={styles.statusText}>Syncing listings...</p>}
                {itemsError && <p style={{ ...styles.statusText, color: '#ef4444' }}>{itemsError}</p>}

                {!itemsLoading && !itemsError && items.length === 0 && (
                    <div style={styles.emptyState}>
                        <p style={{ marginBottom: 12, fontWeight: 600 }}>
                            Your garage is empty.
                        </p>

                        <p style={{ marginBottom: 20 }}>
                            Add your first item to garage clicking "Sell a car" button
                        </p>

                        <Link to="/sell-car" style={styles.sellBtn}>
                            Sell Your First Car
                        </Link>
                    </div>
                )}

                <div style={styles.grid}>
                    {Array.isArray(items) && items.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
});

const styles = {
    container: {
        maxWidth: 1000,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "var(--text-primary)" 
    },
    loader: { padding: "100px 20px", textAlign: "center" as const, color: "var(--text-muted)" }, 
    header: { marginBottom: 60 },
    title: { fontSize: "32px", fontWeight: 800, marginBottom: "32px", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "20px", fontWeight: 700, marginBottom: "24px" },
    infoBlock: {
        background: "var(--bg-card)", 
        padding: "32px",
        borderRadius: "16px",
        border: "1px solid var(--border-color)", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "background-color 0.3s ease, border-color 0.3s ease" 
    },
    details: { marginBottom: 32 },
    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--border-light)", 
        fontSize: "14px",
        transition: "border-color 0.3s ease" 
    },
    label: { color: "var(--text-secondary)", fontWeight: 500 }, 
    value: { color: "var(--text-primary)", fontWeight: 600 }, 
    actions: { display: "flex", gap: 12, flexWrap: "wrap" as const },
    formWrapper: {
        maxWidth: 440,
        padding: "32px",
        background: "var(--bg-card)", 
        borderRadius: "16px",
        border: "1px solid var(--border-color)", 
        transition: "background-color 0.3s ease, border-color 0.3s ease" 
    },
    formTitle: { fontSize: "18px", fontWeight: 700, marginBottom: 20 },
    listingsSection: { marginTop: 40 },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "24px"
    },
    emptyState: {
        padding: "60px 20px",
        textAlign: "center" as const,
        background: "var(--bg-input)", 
        borderRadius: "16px",
        color: "var(--text-muted)", 
        fontSize: "14px",
        transition: "background-color 0.3s ease, color 0.3s ease" 
    },
    statusText: { fontSize: "14px", color: "var(--text-secondary)", marginBottom: 20 }, 
    alertError: {
        padding: "14px 20px",
        marginBottom: 24,
        background: "var(--color-danger-bg)", 
        color: "var(--color-danger-text)", 
        borderRadius: "12px",
        fontSize: "14px",
        border: "1px solid var(--color-danger-border)", 
        fontWeight: 500
    },
    alertSuccess: {
        padding: "14px 20px",
        marginBottom: 24,
        background: "var(--color-success-bg)", 
        color: "var(--color-success-text)", 
        borderRadius: "12px",
        fontSize: "14px",
        border: "1px solid var(--color-success-border)", 
        fontWeight: 500
    },
    btnSecondary: {
        padding: "10px 18px",
        background: "var(--btn-secondary-bg)", 
        color: "var(--btn-secondary-text)", 
        border: "1px solid var(--border-color)", 
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "13px",
        transition: "all 0.2s"
    },
    btnDanger: {
        padding: "10px 18px",
        background: "var(--bg-base)", 
        border: "1px solid var(--color-danger-border)", 
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "13px",
        color: "var(--color-danger-text)",
        transition: "all 0.2s"
    },
    sellBtn: {
        display: "inline-block",
        padding: "12px 20px",
        background: "var(--btn-primary-bg)",
        color: "var(--btn-primary-text)",
        borderRadius: "10px",
        fontWeight: 700,
        fontSize: "14px",
        textDecoration: "none",
        transition: "all 0.2s",
        cursor: "pointer"
    },
};

export default ProfilePage;