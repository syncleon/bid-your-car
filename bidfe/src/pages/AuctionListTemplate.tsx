import { useEffect, useState, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../shared/hooks/useStore.ts";
import { AuctionCard } from "../features/auction/ui/AuctionCard.tsx";
import "./AuctionList.css";

const ITEMS_PER_BATCH = 20;
interface FilterOption {
    label: string | number;
    value: string | number;
}

interface FilterSelectProps {
    label: string;
    value: string | number;
    options: (string | number | FilterOption)[];
    onChange: (val: string) => void;
}

const FilterSelect = ({ label, value, options, onChange }: FilterSelectProps) => (
    <div className="filter-group">
        <label className="filter-label">{label}</label>
        <div className="select-wrapper">
            <select className="filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((opt, idx) => {
                    const val = typeof opt === 'object' && opt !== null ? opt.value : opt;
                    const lab = typeof opt === 'object' && opt !== null ? opt.label : opt;
                    return <option key={`${val}-${idx}`} value={val}>{lab}</option>;
                })}
            </select>
        </div>
    </div>
);

interface TemplateProps {
    title: string;
    status?: string;
    pageSize: number;
    defaultSort?: string;
}

export const AuctionListTemplate = observer(({
                                                 title,
                                                 status,
                                                 pageSize,
                                                 defaultSort = "ending_soon"
                                             }: TemplateProps) => {
    const { auctionStore } = useStore();

    const [filterMake, setFilterMake] = useState("All");
    const [filterYear, setFilterYear] = useState("All");
    const [sortBy, setSortBy] = useState(defaultSort);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const auctionsFromStore = status === 'SOLD'
        ? auctionStore.soldAuctions
        : auctionStore.auctions;

    const makes = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.make));
        return ["All", ...Array.from(unique).sort()];
    }, [auctionsFromStore]);

    const years = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.year));
        return ["All", ...Array.from(unique).sort((a, b) => b - a)];
    }, [auctionsFromStore]);

    useEffect(() => {
        setFilterMake("All");
        setFilterYear("All");
        setSortBy(status === 'SOLD' ? "newly_sold" : defaultSort);
        setVisibleCount(ITEMS_PER_BATCH);

        if (status === 'SOLD') {
            auctionStore.loadRecentlySold(0, pageSize);
        } else {
            auctionStore.loadAuctions(undefined, status, 0, pageSize);
        }
    }, [status, pageSize, defaultSort, auctionStore]);

    const sortOptions = useMemo(() => {
        const options = [
            { label: "Price: Low to High", value: "price_low" },
            { label: "Price: High to Low", value: "price_high" }
        ];

        if (status === 'SOLD') {
            options.unshift({ label: "Recently Sold", value: "newly_sold" });
        } else {
            options.unshift({ label: "Ending Soon", value: "ending_soon" });
            options.push({ label: "Newly Listed", value: "newly_listed" });
        }
        return options;
    }, [status]);

    const filteredAuctions = useMemo(() => {
        let result = [...auctionsFromStore];

        if (filterMake !== "All") result = result.filter(a => a.item.make === filterMake);
        if (filterYear !== "All") result = result.filter(a => a.item.year.toString() === filterYear);

        result.sort((a, b) => {
            switch (sortBy) {
                case "newly_sold":
                    return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
                case "newly_listed":
                    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
                case "price_low":
                    return a.currentPrice - b.currentPrice;
                case "price_high":
                    return b.currentPrice - a.currentPrice;
                case "ending_soon":
                default:
                    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
            }
        });

        return result;
    }, [auctionsFromStore, filterMake, filterYear, sortBy]);

    const visibleAuctions = useMemo(() => {
        return filteredAuctions.slice(0, visibleCount);
    }, [filteredAuctions, visibleCount]);

    const hasMore = visibleCount < filteredAuctions.length;

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setVisibleCount((prev) => Math.min(prev + ITEMS_PER_BATCH, filteredAuctions.length));
            }
        }, {
            root: null,
            rootMargin: "600px",
            threshold: 0.1
        });

        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

        return () => observerRef.current?.disconnect();
    }, [hasMore, filteredAuctions.length]);

    if (auctionStore.isLoading && auctionsFromStore.length === 0) {
        return <div className="loading-state">Loading vehicles...</div>;
    }

    const hasActiveFilters = filterMake !== "All" || filterYear !== "All";

    return (
        <div className="auction-container">
            <header className="auction-header">
                <div className="header-top">
                    <h1 className="page-title">{title}</h1>
                    <span className="result-count">
                        {filteredAuctions.length} vehicles found
                    </span>
                </div>

                <button className="mobile-filter-toggle" onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}>
                    {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters & Sort'}
                </button>

                <div className={`controls-wrapper ${isMobileFiltersOpen ? 'is-open' : ''}`}>
                    <div className="filters-row">
                        <FilterSelect label="Make" value={filterMake} options={makes} onChange={setFilterMake} />
                        <FilterSelect label="Year" value={filterYear} options={years} onChange={setFilterYear} />
                        <FilterSelect label="Sort By" value={sortBy} options={sortOptions} onChange={setSortBy} />
                    </div>
                    {hasActiveFilters && (
                        <button className="reset-btn" onClick={() => { setFilterMake("All"); setFilterYear("All"); }}>Reset</button>
                    )}
                </div>
            </header>

            {visibleAuctions.length === 0 ? (
                <div className="empty-state"><h3>No vehicles found</h3></div>
            ) : (
                <div className="auction-grid">
                    {visibleAuctions.map((auction) => (
                        <div key={auction.id} className="fade-in-item">
                            <AuctionCard auction={auction} />
                        </div>
                    ))}
                    <div ref={sentinelRef} style={{ height: "20px", width: "100%", gridColumn: "1 / -1" }} />
                </div>
            )}

            {hasMore && <div className="scroll-loader">Loading more...</div>}
        </div>
    );
});