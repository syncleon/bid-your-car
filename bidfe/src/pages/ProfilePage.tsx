import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStoreContext } from "../app/providers/useStoreContext";
import { useUserListings } from "../features/profile/hooks/useUserListings";
import { ChangePasswordForm, EditProfileForm } from "../features/profile/ui/ProfileActions";
import { Link, useNavigate } from "react-router-dom";
import { ItemCard } from "../features/item/ui/ItemCard";
import "./ProfilePage.css";

export const ProfilePage = observer(() => {
    const { profileStore, authStore } = useStoreContext();
    const navigate = useNavigate();
    const { items, isLoading: itemsLoading, error: itemsError } = useUserListings();
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'password'>('view');

    useEffect(() => {
        if (!profileStore.profile) {
            profileStore.loadProfile();
        }
        return () => profileStore.clearMessages();
    }, [profileStore]);

    if (profileStore.isLoading && !profileStore.profile) {
        return <div className="profile-loader">Loading Profile...</div>;
    }

    if (!profileStore.profile) {
        return <div className="profile-loader">Access Denied or Failed to Load</div>;
    }

    const handleDeleteAccount = () => {
        const password = prompt("Enter password to confirm deletion:");
        if (password) {
            profileStore.deleteAccount({ password });
        }
    };

    const handleLogout = async () => {
        await authStore.logout();
        navigate("/");
    };

    const username = profileStore.profile.username || "User";
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="profile-container">
            {profileStore.error && (
                <div className="profile-alert profile-alert--error">{profileStore.error}</div>
            )}
            {profileStore.successMessage && (
                <div className="profile-alert profile-alert--success">{profileStore.successMessage}</div>
            )}

            <div className="profile-dashboard">
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div className="profile-header-visual">
                            <div className="profile-avatar">{initial}</div>
                            <h1 className="profile-username">@{username}</h1>
                            <p className="profile-email">{profileStore.profile.email}</p>
                        </div>

                        {viewMode === 'view' && (
                            <>
                                <div className="profile-details">
                                    <div className="profile-detail-row">
                                        <span className="profile-detail-label">Member Since</span>
                                        <span className="profile-detail-value">
                                            {profileStore.profile.createdDate
                                                ? new Date(profileStore.profile.createdDate).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button className="profile-btn profile-btn--secondary" onClick={() => setViewMode('edit')}>
                                        Edit Profile
                                    </button>
                                    <button className="profile-btn profile-btn--secondary" onClick={() => setViewMode('password')}>
                                        Update Password
                                    </button>
                                    <button className="profile-btn profile-btn--secondary" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                    <button className="profile-btn profile-btn--danger" onClick={handleDeleteAccount}>
                                        Deactivate Account
                                    </button>
                                </div>
                            </>
                        )}

                        {viewMode === 'edit' && (
                            <div className="profile-form-wrapper">
                                <h2 className="profile-form-title">Edit Profile Info</h2>
                                <EditProfileForm store={profileStore} onCancel={() => setViewMode('view')} />
                            </div>
                        )}

                        {viewMode === 'password' && (
                            <div className="profile-form-wrapper">
                                <h2 className="profile-form-title">Change Password</h2>
                                <ChangePasswordForm store={profileStore} onCancel={() => setViewMode('view')} />
                            </div>
                        )}
                    </div>
                </aside>

                <section className="garage-section">
                    <div className="garage-header">
                        <h2 className="garage-title">My Garage</h2>
                    </div>

                    {itemsLoading && <p className="profile-loader">Syncing listings...</p>}
                    {itemsError && <p className="profile-alert profile-alert--error">{itemsError}</p>}

                    {!itemsLoading && !itemsError && items.length === 0 && (
                        <div className="garage-empty-state">
                            <svg className="garage-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a2 2 0 00-1.6-.8H9.3a2 2 0 00-1.6.8L5 11l-5.16.86a1 1 0 00-.84.99V16h3m10 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m-10 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0"/>
                            </svg>
                            <h3 className="garage-empty-title">Your garage is empty</h3>
                            <p className="garage-empty-desc">
                                Create a professional listing in minutes and reach thousands of enthusiasts looking for their next ride.
                            </p>
                            <Link to="/sell-car" className="garage-btn-sell">
                                Sell Your First Car
                            </Link>
                        </div>
                    )}

                    <div className="garage-grid">
                        {Array.isArray(items) && items.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
});

export default ProfilePage;