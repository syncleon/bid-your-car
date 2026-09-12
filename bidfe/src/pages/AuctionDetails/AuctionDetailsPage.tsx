import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../shared/hooks/useStore.ts";
import { DetailPageLayout, DetailHeader, ResponsiveGrid, ImageGallery, VehicleInfo, VehicleHeader, DetailSkeleton } from "../../shared/ui/details";
import { BiddingCard } from "../../features/auction/ui/BiddingCard.tsx";

import { formatDistanceToNow } from "date-fns";
import "./AuctionDetails.css";
import { Client } from "@stomp/stompjs";

const getWebSocketUrl = () => {
    let url = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";
    if (url.startsWith('https://')) url = url.replace('https://', 'wss://');
    if (url.startsWith('http://')) url = url.replace('http://', 'ws://');
    return url;
};

export const AuctionDetailsPage = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { auctionStore, authStore} = useStore();

    useEffect(() => {
        if (!id) return;

        auctionStore.loadAuctionDetails(id);

        const stompClient = new Client({
            brokerURL: getWebSocketUrl(),
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/topic/auctions/${id}`, (message) => {
                    const notification = JSON.parse(message.body);
                    console.log("Live update received:", notification);
                    auctionStore.loadAuctionDetails(id);
                });
            },
        });

        stompClient.activate();
        return () => {
            stompClient.deactivate();
            auctionStore.clearSelectedAuction();
            auctionStore.clearError();
        };
    }, [id, auctionStore]);

    if (auctionStore.isLoading && !auctionStore.selectedAuction) {
        return <DetailSkeleton />;
    }

    if (!auctionStore.selectedAuction) {
        return <div className="details-loading">Auction not found.</div>;
    }

    const auction = auctionStore.selectedAuction;
    const item = auction.item;
    const user = authStore.user;

    const isOwner = user?.id?.toString() === item.seller.id.toString();

    const isPending = auction.status === 'PENDING_APPROVAL';
    const isScheduled = auction.status === 'SCHEDULED';
    const isCancelled = auction.status === 'CANCELLED';
    const isEnded = ['SOLD', 'UNSOLD', 'CANCELLED'].includes(auction.status);

    return (
        <DetailPageLayout>
            <DetailHeader onBack={() => navigate('/auctions')} title="Back to Auctions" />
            
            <ResponsiveGrid hasSidebar={false}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="vehicle-header-wrapper" style={{ marginTop: '0', paddingTop: '0', marginBottom: '0' }}>
                        <VehicleHeader item={item} auctionEndTime={auction.endTime} />
                    </div>

                    <div className="gallery-wrapper">
                        <ImageGallery
                            item={item}
                            statusLabel={<StatusBadge status={auction.status} />}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '70fr 30fr', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {!isCancelled ? (
                                <>
                                    <BiddingCard auction={auction} isHorizontal={true} />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
                                        <button style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            backgroundColor: 'var(--bg-card)', 
                                            border: '1px solid var(--border-color)', 
                                            padding: '8px 16px', 
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}>
                                            <span style={{ 
                                                backgroundColor: '#fff', 
                                                color: '#000', 
                                                padding: '2px 6px', 
                                                borderRadius: '6px', 
                                                fontWeight: 900, 
                                                letterSpacing: '1px',
                                                fontSize: '12px' 
                                            }}>CARFAX</span>
                                            Vehicle History Report
                                        </button>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                                            Ending {new Date(auction.endTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {new Date(auction.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {isPending && (
                                            <div className="compact-banner banner-pending">
                                                <strong>Pending Approval</strong>
                                                <p>{isOwner ? "Under review." : "Waiting for admin."}</p>
                                            </div>
                                        )}

                                        {isScheduled && auction.startTime && (
                                            <div className="compact-banner banner-pending">
                                                <strong>Scheduled</strong>
                                                <p>Starts {formatDistanceToNow(new Date(auction.startTime), { addSuffix: true })}.</p>
                                            </div>
                                        )}

                                        {isEnded && !isCancelled && (
                                            <div className="compact-banner" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                <strong>Auction {auction.status}</strong>
                                                <p>Ended {auction.endTime ? formatDistanceToNow(new Date(auction.endTime)) : ''} ago.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-danger-text)' }}>Listing Cancelled / Rejected</h3>
                                    <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>This listing has been cancelled and cannot proceed as an auction.</p>
                                    {item.rejectionReason && (
                                        <div style={{ margin: '16px 0', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                                            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--color-danger-text)' }}>Admin Message:</strong>
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.rejectionReason}</span>
                                        </div>
                                    )}
                                    {isOwner && (
                                        <button 
                                            onClick={() => navigate(`/items/${item.id}`)}
                                            style={{ padding: '10px 20px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                                            Return and edit vehicle
                                        </button>
                                    )}
                                </div>
                            )}

                            <VehicleInfo item={item} hideHeader={true} />
                        </div>
                        <div></div>
                    </div>
                </div>


            </ResponsiveGrid>

        </DetailPageLayout>
    );
});

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'ACTIVE') return null;

    let className = "badge-base ";
    switch (status) {
        case 'PENDING_APPROVAL': className += "badge-pending"; break;
        case 'SCHEDULED': className += "badge-pending"; break; 
        case 'CANCELLED': className += "badge-rejected"; break;
        case 'SOLD': className += "badge-sold"; break;
        case 'UNSOLD': className += "badge-ended"; break;
        default: className += "badge-ended"; break;
    }

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <span className={className}>{status.replace('_', ' ')}</span>
        </div>
    );
};