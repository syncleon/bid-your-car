import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStoreContext } from "../app/providers/useStoreContext";
import { useUserListings } from "../features/profile/hooks/useUserListings";
import { ChangePasswordForm, EditProfileForm } from "../features/profile/ui/ProfileActions";
import { Link, useNavigate } from "react-router-dom";
import { ItemCard } from "../features/item/ui/ItemCard";
import { ConfirmDialog } from "../shared/ui/dialog/ConfirmDialog";
import { PromptDialog } from "../shared/ui/dialog/PromptDialog";
import { Modal } from "../shared/ui/dialog/Modal";
import { Loader } from "../shared/ui/Loader/Loader";
import { Skeleton } from "../shared/ui/Skeleton/Skeleton";
import "./ProfilePage.css";

export const ProfilePage = observer(() => {
    const { profileStore, authStore } = useStoreContext();
    const navigate = useNavigate();
    const { items, isLoading: itemsLoading, error: itemsError } = useUserListings();
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'password'>('view');
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
    const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

    const handleSetViewMode = (mode: 'view' | 'edit' | 'password') => {
        if (!document.startViewTransition) {
            setViewMode(mode);
            return;
        }
        document.startViewTransition(() => {
            setViewMode(mode);
        });
    };

    useEffect(() => {
        if (!profileStore.profile) {
            profileStore.loadProfile();
        }
        return () => profileStore.clearMessages();
    }, [profileStore]);

    if (profileStore.isLoading && !profileStore.profile) {
        return <Loader fullPage label="Loading Profile..." />;
    }

    if (!profileStore.profile) {
        return <div className="profile-loader">Access Denied or Failed to Load</div>;
    }

    const handleDeleteAccount = () => {
        setDeleteAccountError(null);
        setDeleteAccountDialogOpen(true);
    };

    const confirmDeleteAccount = async (password: string) => {
        setDeleteAccountError(null);
        try {
            await profileStore.deleteAccount({ password });
            setDeleteAccountDialogOpen(false);
        } catch (error: any) {
            setDeleteAccountError(profileStore.error || "Failed to delete account");
            profileStore.clearMessages();
        }
    };

    const handleLogout = () => {
        setLogoutDialogOpen(true);
    };

    const confirmLogout = async () => {
        setLogoutDialogOpen(false);
        await authStore.logout();
        navigate("/");
    };

    const username = profileStore.profile.username || "User";
    const initial = username.charAt(0).toUpperCase();

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            profileStore.uploadPhoto(e.target.files[0]);
        }
    };

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
                            <div className="profile-avatar">
                                {profileStore.profile.profilePhotoUrl ? (
                                    <img src={profileStore.profile.profilePhotoUrl} alt="Avatar" className="profile-avatar-img" />
                                ) : (
                                    initial
                                )}
                                <label className="profile-avatar-overlay">
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                    <span>Edit</span>
                                </label>
                            </div>
                            <h1 className="profile-username">@{username}</h1>
                            <p className="profile-email">{profileStore.profile.email}</p>
                            {profileStore.profile.bio && (
                                <p className="profile-bio">{profileStore.profile.bio}</p>
                            )}
                        </div>

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
                            <button className="profile-btn profile-btn--secondary" onClick={() => handleSetViewMode('edit')}>
                                Edit Profile
                            </button>
                            <button className="profile-btn profile-btn--secondary" onClick={() => handleSetViewMode('password')}>
                                Update Password
                            </button>
                            <button className="profile-btn profile-btn--secondary" onClick={handleLogout}>
                                Log Out
                            </button>
                            <button className="profile-btn profile-btn--danger" onClick={handleDeleteAccount}>
                                Deactivate Account
                            </button>
                        </div>
                    </div>
                </aside>

                <section className="garage-section">
                    <div className="garage-header">
                        <h2 className="garage-title">My Garage</h2>
                    </div>

                    {itemsLoading && (
                        <div className="garage-grid">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height="320px" borderRadius="12px" />
                            ))}
                        </div>
                    )}
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

            <ConfirmDialog
                isOpen={logoutDialogOpen}
                title="Log Out"
                message="Are you sure you want to log out?"
                onConfirm={confirmLogout}
                onCancel={() => setLogoutDialogOpen(false)}
                confirmLabel="Log Out"
            />

            <PromptDialog
                isOpen={deleteAccountDialogOpen}
                title="Delete Account"
                message="This action is permanent and cannot be undone. Enter your password to confirm."
                placeholder="Password"
                isPassword={true}
                error={deleteAccountError}
                onConfirm={confirmDeleteAccount}
                onCancel={() => setDeleteAccountDialogOpen(false)}
                confirmLabel="Delete Account"
            />

            <Modal isOpen={viewMode === 'edit'} onClose={() => handleSetViewMode('view')} title="Edit Profile">
                <EditProfileForm store={profileStore} onCancel={() => handleSetViewMode('view')} />
            </Modal>

            <Modal isOpen={viewMode === 'password'} onClose={() => handleSetViewMode('view')} title="Update Password">
                <ChangePasswordForm store={profileStore} onCancel={() => handleSetViewMode('view')} />
            </Modal>
        </div>
    );
});

export default ProfilePage;