import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";
import { Skeleton } from "../../shared/ui/Skeleton/Skeleton";

export const AdminUsersPage = observer(() => {
    const { adminStore } = useStore();

    useEffect(() => {
        adminStore.fetchUsers();
    }, [adminStore]);

    const handleDeactivate = (id: number) => {
        if (window.confirm("Are you sure you want to deactivate this user?")) {
            adminStore.deactivateUser(id);
        }
    };

    return (
        <div>
            <h1>Manage Users</h1>
            {adminStore.error && <p style={{ color: "red" }}>{adminStore.error}</p>}
            
            {adminStore.isLoadingUsers ? (
                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-card)', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Username</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} style={{ backgroundColor: 'var(--bg-base)' }}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="30px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="120px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="180px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="60px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="30px" width="100px" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '600px' }}>
                        <thead>
                        <tr style={{ backgroundColor: 'var(--bg-card)', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Username</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminStore.users.map((user) => (
                            <tr key={user.id} style={{ backgroundColor: 'var(--bg-base)' }}>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>{user.id}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>{user.username}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>{user.email}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    {user.enabled ? "Active" : "Inactive"}
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <button 
                                        onClick={() => handleDeactivate(user.id)}
                                        disabled={!user.enabled}
                                        style={{ padding: '5px 10px', cursor: user.enabled ? 'pointer' : 'not-allowed', backgroundColor: user.enabled ? 'var(--color-danger-bg)' : 'var(--bg-input)', color: user.enabled ? 'var(--color-danger-text)' : 'var(--text-muted)', border: '1px solid ' + (user.enabled ? 'var(--color-danger-border)' : 'var(--border-color)'), borderRadius: '4px' }}
                                    >
                                        Deactivate
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {adminStore.users.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
});
