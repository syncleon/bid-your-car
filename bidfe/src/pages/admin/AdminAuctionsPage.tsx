import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";
import { Link } from "react-router-dom";
import { Skeleton } from "../../shared/ui/Skeleton/Skeleton";

export const AdminAuctionsPage = observer(() => {
    const { adminStore } = useStore();
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

    return (
        <div>
            <h1>Manage Auctions</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px' }}>Filter by Status: </label>
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '5px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                    <option value="">All</option>
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
                                        {auction.item.year} {auction.item.make} {auction.item.model}
                                    </Link>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>{auction.status}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    {auction.status === 'PENDING_APPROVAL' && (
                                        <Link 
                                            to={`/auctions/${auction.id}`}
                                            style={{ display: 'inline-block', padding: '5px 10px', cursor: 'pointer', marginRight: '10px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}
                                        >
                                            Review Listing
                                        </Link>
                                    )}
                                    {auction.status === 'ACTIVE' && (
                                        <button 
                                            onClick={() => handleCancel(auction.id)}
                                            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '4px' }}
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
        </div>
    );
});
