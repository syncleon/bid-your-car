import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { auctionStore } from "../model/auction.store.ts";
import { AuctionCard } from "./AuctionCard.tsx";
import "./AuctionList.css";

// --- Configuration ---
const ITEMS_PER_BATCH = 20;

// --- Helper Component (Unchanged) ---
const FilterSelect = ({ label, value, options, onChange }: any) => (
    <div className="filter-group">
        <label className="filter-label">{label}</label>
        <div className="select-wrapper">
            <select className="filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((opt: any, idx: number) => {
                    const val = typeof opt === 'object' && opt !== null ? opt.value : opt;
                    const lab = typeof opt === 'object' && opt !== null ? opt.label : opt;
                    return <option key={`${val}-${idx}`} value={val}>{lab}</option>;
                })}
            </select>
        </div>
    </div>
);

export const AuctionListTemplate = observer(({
                                                 title,
                                                 status,
                                                 pageSize,
                                                 defaultSort = "ending_soon"
                                             }: any) => {

    // --- State ---
    const [filterMake, setFilterMake] = useState("All");
    const [filterYear, setFilterYear] = useState("All");
    const [sortBy, setSortBy] = useState(defaultSort);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Smooth Scroll State
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null); // The invisible watcher

    // --- Data Loading ---
    useEffect(() => {
        setFilterMake("All");
        setFilterYear("All");
        setSortBy(defaultSort);
        setVisibleCount(ITEMS_PER_BATCH);

        // Load ALL data initially (or a large page size) so client-side filtering works
        auctionStore.loadAuctions(status, 0, pageSize);
    }, [status, pageSize, defaultSort]);

    const allAuctions = auctionStore.auctions;

    // --- Computed Options ---
    const makes = useMemo(() => {
        const unique = new Set(allAuctions.map(a => a.item.make));
        return ["All", ...Array.from(unique).sort()];
    }, [allAuctions]);

    const years = useMemo(() => {
        const unique = new Set(allAuctions.map(a => a.item.year));
        return ["All", ...Array.from(unique).sort((a: any, b: any) => b - a)];
    }, [allAuctions]);

    // --- Filtering & Sorting ---
    const filteredAuctions = useMemo(() => {
        let result = [...allAuctions];

        if (filterMake !== "All") result = result.filter(a => a.item.make === filterMake);
        if (filterYear !== "All") result = result.filter(a => a.item.year.toString() === filterYear);

        result.sort((a, b) => {
            const priceA = a.currentHighestBid ?? a.startPrice;
            const priceB = b.currentHighestBid ?? b.startPrice;

            switch (sortBy) {
                case "newly_listed": return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
                case "newly_ended": return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
                case "price_low": return priceA - priceB;
                case "price_high": return priceB - priceA;
                case "ending_soon": default: return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
            }
        });

        return result;
    }, [allAuctions, filterMake, filterYear, sortBy]);

    // --- Smooth Infinite Scroll Logic ---

    // 1. Slice the data
    const visibleAuctions = useMemo(() => {
        return filteredAuctions.slice(0, visibleCount);
    }, [filteredAuctions, visibleCount]);

    const hasMore = visibleCount < filteredAuctions.length;

    // 2. The Observer
    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            // If the sentinel (bottom div) is visible (or close to visible)...
            if (entries[0].isIntersecting && hasMore) {
                // ...load more items smoothly
                setVisibleCount((prev) => Math.min(prev + ITEMS_PER_BATCH, filteredAuctions.length));
            }
        }, {
            root: null,
            rootMargin: "600px", // KEY: Load 600px BEFORE the user hits the bottom
            threshold: 0.1
        });

        if (sentinelRef.current) {
            observer.current.observe(sentinelRef.current);
        }

        return () => observer.current?.disconnect();
    }, [hasMore, filteredAuctions.length]); // Re-run if list length changes

    // --- Render ---

    if (auctionStore.isLoading && allAuctions.length === 0) {
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
                        <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={[
                            { label: "Ending Soon", value: "ending_soon" },
                            { label: "Price: Low to High", value: "price_low" },
                            { label: "Price: High to Low", value: "price_high" }
                        ]} />
                    </div>
                    {hasActiveFilters && (
                        <button className="reset-btn" onClick={() => { setFilterMake("All"); setFilterYear("All"); }}>Reset</button>
                    )}
                </div>
            </header>

            {/* Grid */}
            {visibleAuctions.length === 0 ? (
                <div className="empty-state"><h3>No vehicles found</h3></div>
            ) : (
                <div className="auction-grid">
                    {visibleAuctions.map((auction) => (
                        <div key={auction.id} className="fade-in-item">
                            <AuctionCard auction={auction} />
                        </div>
                    ))}

                    {/* SENTINEL: Invisible watcher at the end of the list */}
                    <div ref={sentinelRef} style={{ height: "20px", width: "100%", gridColumn: "1 / -1" }} />
                </div>
            )}

            {/* Show tiny loader only if we are actually fetching from API, otherwise it's instant */}
            {hasMore && <div className="scroll-loader">Loading more...</div>}
        </div>
    );
});