import { BaseCard, CardBadge, CardPricePill, CardSpecsGrid } from "../../../widgets/BaseCard/BaseCard";
import { CheckCircleIcon } from "../../../widgets/BaseCard/CardSpecsGrid";
import type { ItemDto } from "../types";

interface ItemCardProps {
    item: ItemDto;
}

export const ItemCard = ({ item }: ItemCardProps) => {
    const mainImage = item.thumbnailUrl ||
        item.images?.find(img => img.category === "MAIN")?.url ||
        item.images?.[0]?.url;

    const isLive = item.status === 'ACTIVE_AUCTION';
    const isSold = item.status === 'SOLD';
    const isPending = item.status === 'PENDING_AUCTION';
    const isScheduled = item.status === 'LISTED_AUCTION';
    const isUnsold = item.status === 'UNSOLD';
    const isRejected = item.status === 'REJECTED';

    let statusText = "Draft";
    let statusColor = "#94a3b8";

    if (isSold) {
        statusText = "Sold";
        statusColor = "var(--text-secondary)";
    } else if (isLive) {
        statusText = "Live";
        statusColor = "var(--color-danger-text)";
    } else if (isScheduled) {
        statusText = "Scheduled";
        statusColor = "var(--color-primary)";
    } else if (isPending) {
        statusText = "Pending";
        statusColor = "#f59e0b";
    } else if (isRejected) {
        statusText = "Rejected";
        statusColor = "#ef4444";
    } else if (isUnsold) {
        statusText = "Unsold";
        statusColor = "#64748b";
    }

    const hasAuction = Boolean(item.auction);
    const conditionText = item.condition ? item.condition.replace('_', ' ') : null;

    return (
        <BaseCard
            to={`/items/${item.id}`}
            imageUrl={mainImage}
            title={{ year: item.year, make: item.make, model: item.model }}
            overlays={{
                topLeft: (
                    <CardBadge dotColor={statusColor}>
                        {statusText}
                    </CardBadge>
                ),
                topRight: (
                    hasAuction ? (
                        conditionText ? <CardBadge>Condition: {conditionText}</CardBadge> : null
                    ) : (
                        item.titleStatus ? <CardBadge>{item.titleStatus} Title</CardBadge> : null
                    )
                ),
                bottomLeft: (
                    hasAuction && item.auction ? (
                        <CardPricePill
                            priceLabel={item.auction.status === 'SOLD' ? 'Winning Bid' : 'Bid'}
                            priceValue={`$${item.auction.currentPrice.toLocaleString()}`}
                            rightContent={
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircleIcon />
                                    <span style={{ fontSize: "14px" }}>
                                        {item.auction.status === 'SOLD' ? 'Closed' : 'Active'}
                                    </span>
                                </div>
                            }
                        />
                    ) : (
                        conditionText ? (
                            <CardPricePill
                                rightContent={
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <CheckCircleIcon />
                                        <span style={{ fontSize: "14px", fontWeight: 600 }}>
                                            Condition: {conditionText}
                                        </span>
                                    </div>
                                }
                            />
                        ) : null
                    )
                )
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    gap: "4px",
                    paddingBottom: "2px",
                    minWidth: 0,
                    marginTop: "auto",
                }}
            >
                <CardSpecsGrid
                    mileage={item.mileage}
                    transmission={item.transmission}
                    engineOrFuel={item.engine || item.fuelType}
                    location={item.location}
                />
            </div>
        </BaseCard>
    );
};