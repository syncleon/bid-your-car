import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";
import { Link } from "react-router-dom";
import { Skeleton } from "../../shared/ui/Skeleton/Skeleton";

export const AdminAuctionsPage = observer(() => {
    const { adminStore, auctionStore } = useStore();
    const [statusFilter, setStatusFilter] = useState<string>("");

    useEffect(() => {
        adminStore.fetchAuctions(statusFilter);
    }, [adminStore, statusFilter]);

    // Approve logic moved entirely to the details page

    const handleCancel = (id: string) => {
        if (window.confirm("FORCE CANCEL this auction? This cannot be undone.")) {
            adminStore.forceCancelAuction(id, statusFilter);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        Active
                    </span>
                );
            case 'PENDING_APPROVAL':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        Pending
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                        Completed
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
                        {status}
                    </span>
                );
        }
    };

    return (
        <div>
            <h1>Manage Auctions</h1>
            
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by Status:</label>
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ 
                        height: '38px', 
                        padding: '6px 14px', 
                        backgroundColor: 'var(--bg-input)', 
                        color: 'var(--text-primary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        outline: 'none', 
                        cursor: 'pointer' 
                    }}
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {adminStore.error && <p style={{ color: "red" }}>{adminStore.error}</p>}
            
            {adminStore.isLoadingAuctions ? (
                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-card)', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Title</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} style={{ backgroundColor: 'var(--bg-base)' }}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="80px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="200px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="100px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="30px" width="120px" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                        <tr style={{ backgroundColor: 'var(--bg-card)', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Title</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminStore.sortedAuctions.map((auction) => (
                            <tr key={auction.id} style={{ backgroundColor: 'var(--bg-base)' }}>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <span title={auction.id}>{auction.id.substring(0, 8)}...</span>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <Link to={`/auctions/${auction.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                        {`${auction.item.year} ${auction.item.make} ${auction.item.model}`}
                                    </Link>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>{getStatusBadge(auction.status)}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    {auction.status === 'PENDING_APPROVAL' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={async () => {
                                                    if (window.confirm("Approve this auction? It will become active immediately.")) {
                                                        const success = await auctionStore.approveAuction(auction.id);
                                                        if (success) adminStore.fetchAuctions(statusFilter);
                                                    }
                                                }}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (window.confirm("Reject this listing? This will cancel the auction and cannot be undone.")) {
                                                        const success = await auctionStore.adminCancelAuction(auction.id);
                                                        if (success) adminStore.fetchAuctions(statusFilter);
                                                    }
                                                }}
                                                style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                                            >
                                                Reject
                                            </button>
                                            <Link 
                                                to={`/auctions/${auction.id}`}
                                                style={{ display: 'inline-block', padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}
                                            >
                                                Review
                                            </Link>
                                        </div>
                                    )}
                                    {auction.status === 'ACTIVE' && (
                                        <button 
                                            onClick={() => handleCancel(auction.id)}
                                            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '6px' }}
                                        >
                                            Force Cancel
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {adminStore.sortedAuctions.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>No auctions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            )}

            {/* Pagination Controls */}
            {adminStore.totalPagesAuctions > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                    <button 
                        onClick={() => adminStore.fetchAuctions(statusFilter, adminStore.currentPageAuctions - 1)}
                        disabled={adminStore.currentPageAuctions === 0 || adminStore.isLoadingAuctions}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: adminStore.currentPageAuctions === 0 ? 'not-allowed' : 'pointer', opacity: adminStore.currentPageAuctions === 0 ? 0.5 : 1 }}
                    >
                        Previous
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
                        Page {adminStore.currentPageAuctions + 1} of {adminStore.totalPagesAuctions}
                    </span>
                    <button 
                        onClick={() => adminStore.fetchAuctions(statusFilter, adminStore.currentPageAuctions + 1)}
                        disabled={adminStore.currentPageAuctions >= adminStore.totalPagesAuctions - 1 || adminStore.isLoadingAuctions}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: adminStore.currentPageAuctions >= adminStore.totalPagesAuctions - 1 ? 'not-allowed' : 'pointer', opacity: adminStore.currentPageAuctions >= adminStore.totalPagesAuctions - 1 ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
});
