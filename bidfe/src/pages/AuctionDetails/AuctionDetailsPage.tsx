import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../shared/hooks/useStore.ts";
import { DetailPageLayout, ImageGallery, VehicleInfo, VehicleHeader, DetailSkeleton } from "../../shared/ui/details";
import { BiddingCard } from "../../features/auction/ui/BiddingCard.tsx";
import { BidHistoryList } from "../../features/bid/ui/BidHistoryList.tsx";

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

        const token = localStorage.getItem('auth_token');
        const stompClient = new Client({
            brokerURL: getWebSocketUrl(),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
                <div className="auction-layout-container">
                    {/* Left Column: Gallery & Info */}
                    <div className="gallery-section">
                            <ImageGallery
                                item={item}
                                statusLabel={<StatusBadge status={auction.status} />}
                            />
                        </div>

                        <div className="auction-main-content">

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                            {!isCancelled ? (
                                <>
                                    {(isPending || (isScheduled && auction.startTime) || (isEnded && !isCancelled)) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', marginBottom: '8px' }}>
                                        {isPending && (
                                            <div className="compact-banner banner-pending">
                                                <strong>Pending Approval</strong>
                                                <p>{isOwner ? "Your listing is currently under review by our curation team." : "This auction is awaiting curator approval before opening for bidding."}</p>
                                            </div>
                                        )}

                                        {isScheduled && auction.startTime && (
                                            <div className="compact-banner banner-pending">
                                                <strong>Scheduled</strong>
                                                <p>Bidding opens {formatDistanceToNow(new Date(auction.startTime), { addSuffix: true })}.</p>
                                            </div>
                                        )}

                                        {isEnded && !isCancelled && (
                                            <div className="compact-banner" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                <strong>{auction.status === 'SOLD' ? 'Auction Completed • Sold' : (auction.isNoReserve ? 'Auction Ended • Unsold' : 'Auction Ended • Reserve Not Met')}</strong>
                                                <p>Ended {auction.endTime ? formatDistanceToNow(new Date(auction.endTime), { addSuffix: true }) : ''}.</p>
                                            </div>
                                        )}
                                    </div>
                                    )}
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
                            <VehicleInfo item={item} hideHeader={true} isNoReserve={auction?.isNoReserve || item.auction?.isNoReserve} />
                        </div>
                    </div>

                    {/* Right Column: Bidding Card & Bid History */}
                    <div className="auction-sidebar">
                        <VehicleHeader item={item} />
                        {!isCancelled && (
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, minHeight: 0 }}>
                                <BiddingCard auction={auction} />
                                <BidHistoryList
                                    bids={auctionStore.bidHistory}
                                    isEnded={isEnded}
                                    isSold={auction.status === 'SOLD'}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
