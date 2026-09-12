import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore";
import { Link } from "react-router-dom";
import { Skeleton } from "../../shared/ui/Skeleton/Skeleton";

export const AdminDashboardPage = observer(() => {
    const { authStore, adminStore, auctionStore } = useStore();
    const [editingAuctionId, setEditingAuctionId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        startTime: "",
        endTime: "",
        startPrice: 0,
        reservePrice: 0,
        isNoReserve: false,
        year: 0,
        make: "",
        model: "",
        vin: "",
        description: ""
    });

    useEffect(() => {
        adminStore.fetchAuctions("PENDING_APPROVAL", 0);
    }, [adminStore]);

    const handleEditClick = (auction: any) => {
        setEditingAuctionId(auction.id);
        setEditForm({
            startTime: auction.startTime ? new Date(auction.startTime).toISOString().slice(0, 16) : "",
            endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : "",
            startPrice: auction.startPrice || 0,
            reservePrice: auction.reservePrice || 0,
            isNoReserve: auction.isNoReserve || false,
            year: auction.item?.year || 0,
            make: auction.item?.make || "",
            model: auction.item?.model || "",
            vin: auction.item?.vin || "",
            description: auction.item?.description || ""
        });
    };

    const handleCancelEdit = () => {
        setEditingAuctionId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingAuctionId) return;
        const dto = {
            startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : undefined,
            endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined,
            startPrice: Number(editForm.startPrice),
            reservePrice: editForm.isNoReserve ? undefined : Number(editForm.reservePrice),
            isNoReserve: editForm.isNoReserve,
            itemUpdates: {
                year: Number(editForm.year),
                make: editForm.make,
                model: editForm.model,
                vin: editForm.vin,
                description: editForm.description
            }
        };
        const success = await adminStore.adminUpdateAuction(editingAuctionId, dto, "PENDING_APPROVAL");
        if (success) {
            setEditingAuctionId(null);
        }
    };

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '6px', marginTop: '20px', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Welcome, {authStore.user?.username}!</h2>
                <p>Use the sidebar to navigate the admin panel.</p>
                <ul style={{ marginTop: '20px', lineHeight: '1.6' }}>
                    <li><strong>Users:</strong> Deactivate accounts.</li>
                    <li><strong>Auctions:</strong> Approve pending listings or force cancel active ones.</li>
                </ul>
            </div>

            <h2>Pending Approval Auctions</h2>
            {adminStore.error && <p style={{ color: "red" }}>{adminStore.error}</p>}
            
            {adminStore.isLoadingAuctions ? (
                <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-card)', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Title</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} style={{ backgroundColor: 'var(--bg-base)' }}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="80px" /></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}><Skeleton height="20px" width="200px" /></td>
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
                            <th style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminStore.sortedAuctions.filter(a => a.status === 'PENDING_APPROVAL').map((auction) => (
                            <tr key={auction.id} style={{ backgroundColor: 'var(--bg-base)' }}>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <span title={auction.id}>{auction.id.substring(0, 8)}...</span>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <Link to={`/auctions/${auction.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                        {auction.item.year} {auction.item.make} {auction.item.model}
                                    </Link>
                                    
                                    {editingAuctionId === auction.id && (
                                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Year:</label>
                                                <input type="number" value={editForm.year} onChange={e => setEditForm({...editForm, year: Number(e.target.value)})} style={{ marginLeft: '10px', padding: '5px', width: '80px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Make:</label>
                                                <input type="text" value={editForm.make} onChange={e => setEditForm({...editForm, make: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Model:</label>
                                                <input type="text" value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>VIN:</label>
                                                <input type="text" value={editForm.vin} onChange={e => setEditForm({...editForm, vin: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Description:</label>
                                                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ marginLeft: '10px', padding: '5px', width: '100%', minHeight: '60px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Start Time:</label>
                                                <input type="datetime-local" value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>End Time:</label>
                                                <input type="datetime-local" value={editForm.endTime} onChange={e => setEditForm({...editForm, endTime: e.target.value})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>Start Price:</label>
                                                <input type="number" step="0.01" value={editForm.startPrice} onChange={e => setEditForm({...editForm, startPrice: Number(e.target.value)})} style={{ marginLeft: '10px', padding: '5px' }} />
                                            </div>
                                            <div style={{ marginBottom: '10px' }}>
                                                <label>No Reserve:</label>
                                                <input type="checkbox" checked={editForm.isNoReserve} onChange={e => setEditForm({...editForm, isNoReserve: e.target.checked})} style={{ marginLeft: '10px' }} />
                                            </div>
                                            {!editForm.isNoReserve && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label>Reserve Price:</label>
                                                    <input type="number" step="0.01" value={editForm.reservePrice} onChange={e => setEditForm({...editForm, reservePrice: Number(e.target.value)})} style={{ marginLeft: '10px', padding: '5px' }} />
                                                </div>
                                            )}
                                            <div>
                                                <button onClick={handleSaveEdit} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', marginRight: '10px' }}>Save</button>
                                                <button onClick={handleCancelEdit} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }}>Cancel</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm("Approve this auction? It will become active immediately.")) {
                                                    const success = await auctionStore.approveAuction(auction.id);
                                                    if (success) adminStore.fetchAuctions("PENDING_APPROVAL", 0);
                                                }
                                            }}
                                            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(auction)}
                                            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                const reason = window.prompt("Reject this listing? This will cancel the auction and cannot be undone.\n\nEnter rejection reason (optional):");
                                                if (reason !== null) { // User didn't click Cancel
                                                    const success = await auctionStore.adminCancelAuction(auction.id, reason.trim());
                                                    if (success) adminStore.fetchAuctions("PENDING_APPROVAL", 0);
                                                }
                                            }}
                                            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {adminStore.sortedAuctions.filter(a => a.status === 'PENDING_APPROVAL').length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '20px', textAlign: 'center' }}>No pending approval auctions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
});
