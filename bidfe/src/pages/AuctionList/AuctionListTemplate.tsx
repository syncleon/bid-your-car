import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../shared/hooks/useStore.ts";
import { AuctionCard } from "../../features/auction/ui/AuctionCard.tsx";
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
    hideAllOption?: boolean;
    icon?: React.ReactNode;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, opacity: 0.6 }}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const FilterSelect = ({ label, value, options, onChange, hideAllOption, icon }: FilterSelectProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    
    const normalised = options.map(o =>
        typeof o === "object" && o !== null
            ? { label: String(o.label), value: String(o.value) }
            : { label: String(o), value: String(o) }
    );

    
    const current = normalised.find(o => o.value === String(value));
    const displayLabel = current && (!hideAllOption ? current.value !== "All" : true) ? current.label : label;
    const hasValue = hideAllOption ? true : current?.value !== "All";

    
    const handleOutside = useCallback((e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }, []);

    useEffect(() => {
        if (open) document.addEventListener("mousedown", handleOutside);
        else document.removeEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open, handleOutside]);

    const select = (val: string) => { onChange(val); setOpen(false); };

    return (
        <div className={`custom-select${open ? " custom-select--open" : ""}`} ref={ref}>
            <button
                type="button"
                className={`custom-select__trigger${hasValue && !hideAllOption ? " custom-select__trigger--active" : ""}`}
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                {icon && <span className="custom-select__icon">{icon}</span>}
                <span className="custom-select__label">{displayLabel}</span>
                <ChevronIcon open={open} />
            </button>

            {open && (
                <div className="custom-select__dropdown" role="listbox">
                    {!hideAllOption && (
                        <button
                            type="button"
                            role="option"
                            aria-selected={!hasValue}
                            className={`custom-select__option${!hasValue ? " custom-select__option--selected" : ""}`}
                            onClick={() => select("All")}
                        >
                            <span className="custom-select__option-text">{label}</span>
                            {!hasValue && <CheckIcon />}
                        </button>
                    )}
                    {normalised.filter(o => o.value !== "All").map(o => (
                        <button
                            key={o.value}
                            type="button"
                            role="option"
                            aria-selected={String(value) === o.value}
                            className={`custom-select__option${String(value) === o.value ? " custom-select__option--selected" : ""}`}
                            onClick={() => select(o.value)}
                        >
                            <span className="custom-select__option-text">{o.label}</span>
                            {String(value) === o.value && <CheckIcon />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);


const _FilterIcons = {
    Make: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a3 3 0 1 1-6 0m10 0a3 3 0 1 1-6 0M9 16a3 3 0 1 1-6 0"/></svg>,
    Year: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    Transmission: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 12h8.5"/><path d="M12 12 5.5 5.5"/></svg>,
    Condition: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Sort: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
};

const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skeleton-image shimmer" />
        <div className="skeleton-body">
            <div className="skeleton-line wide shimmer" />
            <div className="skeleton-line medium shimmer" />
            <div className="skeleton-line narrow shimmer" />
        </div>
    </div>
);

const SkeletonGrid = () => (
    <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
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
    const [filterTransmission, setFilterTransmission] = useState("All");
    const [filterCondition, setFilterCondition] = useState("All");
    const [sortBy, setSortBy] = useState(defaultSort);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

    const setSearchQuery = (val: string) => {
        setSearchParams(prev => {
            if (val) prev.set("q", val);
            else prev.delete("q");
            return prev;
        }, { replace: true });
        setVisibleCount(ITEMS_PER_BATCH);
    };

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const auctionsFromStore = (status === 'SOLD'
        ? auctionStore.soldAuctions
        : auctionStore.auctions).slice();

    const makes = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.make));
        return ["All", ...Array.from(unique).sort()];
    }, [auctionsFromStore]);

    const years = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.year));
        return ["All", ...Array.from(unique).sort((a, b) => b - a)];
    }, [auctionsFromStore]);

    const transmissions = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.transmission).filter(Boolean));
        return ["All", ...Array.from(unique).sort()];
    }, [auctionsFromStore]);

    const conditions = useMemo(() => {
        const unique = new Set(auctionsFromStore.map(a => a.item.condition).filter(Boolean));
        return ["All", ...Array.from(unique).sort()];
    }, [auctionsFromStore]);

    useEffect(() => {
        setFilterMake("All");
        setFilterYear("All");
        setFilterTransmission("All");
        setFilterCondition("All");
        setSortBy(status === 'SOLD' ? "newly_sold" : defaultSort);
        setVisibleCount(ITEMS_PER_BATCH);

        if (status === 'SOLD') {
            auctionStore.loadRecentlySold(0, pageSize);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            auctionStore.loadAuctions(undefined, status as any, 0, pageSize);
        }
    }, [status, pageSize, defaultSort, auctionStore]);

    const _sortOptions = useMemo(() => {
        const options = [
            { label: "Price: Low to High", value: "price_low" },
            { label: "Price: High to Low", value: "price_high" }
        ];

        if (status === 'SOLD') {
            options.unshift({ label: "Recently Sold", value: "newly_sold" });
        } else {
            options.unshift({ label: "Ending Soon", value: "ending_soon" });
            options.push({ label: "Newly Listed", value: "newly_listed" });
            options.push({ label: "Lowest Mileage", value: "lowest_mileage" });
        }
        return options;
    }, [status]);

    const filteredAuctions = useMemo(() => {
        let result = [...auctionsFromStore];

        if (filterMake !== "All") result = result.filter(a => a.item.make === filterMake);
        if (filterYear !== "All") result = result.filter(a => a.item.year.toString() === filterYear);
        if (filterTransmission !== "All") result = result.filter(a => a.item.transmission === filterTransmission);
        if (filterCondition !== "All") result = result.filter(a => a.item.condition === filterCondition);

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(a =>
                `${a.item.year} ${a.item.make} ${a.item.model} ${a.item.location}`.toLowerCase().includes(q)
            );
        }

        result = result.filter(a => !!a);

        result.sort((a, b) => {
            let diff = 0;
            switch (sortBy) {
                case "newly_sold":
                    diff = new Date(b?.endTime || 0).getTime() - new Date(a?.endTime || 0).getTime();
                    break;
                case "newly_listed":
                    diff = new Date(b?.startTime || 0).getTime() - new Date(a?.startTime || 0).getTime();
                    break;
                case "price_low":
                    diff = a.currentPrice - b.currentPrice;
                    break;
                case "price_high":
                    diff = b.currentPrice - a.currentPrice;
                    break;
                case "lowest_mileage":
                    diff = a.item.mileage - b.item.mileage;
                    break;
                case "ending_soon":
                default:
                    diff = new Date(a?.endTime || 0).getTime() - new Date(b?.endTime || 0).getTime();
                    break;
            }
            return diff !== 0 ? diff : a.id.localeCompare(b.id);
        });

        return result;
    }, [auctionsFromStore, filterMake, filterYear, filterTransmission, filterCondition, searchQuery, sortBy]);

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
        }, { root: null, rootMargin: "600px", threshold: 0.1 });

        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [hasMore, filteredAuctions.length]);

    useEffect(() => {
        
        const intervalId = setInterval(() => {
            if (status === 'SOLD') {
                auctionStore.loadRecentlySold(0, pageSize);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                auctionStore.loadAuctions(undefined, status as any, 0, pageSize);
            }
        }, 15000);

        return () => clearInterval(intervalId);
    }, [status, pageSize, auctionStore]);

    
    const chips: { label: string; clear: () => void }[] = [];
    if (filterMake !== "All") chips.push({ label: filterMake, clear: () => setFilterMake("All") });
    if (filterYear !== "All") chips.push({ label: filterYear.toString(), clear: () => setFilterYear("All") });
    if (filterTransmission !== "All") chips.push({ label: filterTransmission, clear: () => setFilterTransmission("All") });
    if (filterCondition !== "All") chips.push({ label: filterCondition.replace('_', ' '), clear: () => setFilterCondition("All") });
    if (searchQuery.trim()) chips.push({ label: `"${searchQuery}"`, clear: () => setSearchQuery("") });

    const hasActiveFilters = chips.length > 0;

    const isInitialLoading = auctionStore.isLoading && auctionsFromStore.length === 0;

    return (
        <div className="auction-container">
            <header className="auction-header">
                <div className="header-top">
                    <h1 className="page-title">{title}</h1>

                    <button
                        className="mobile-filter-toggle"
                        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                    >
                        {isMobileFiltersOpen ? '▲ Hide Filters' : '▼ Filters & Sort'}
                    </button>

                    <div className={`controls-wrapper ${isMobileFiltersOpen ? 'mobile-open' : 'mobile-hidden'}`}>
                        <div className="controls-bar">
                            <FilterSelect label="Make" value={filterMake} options={makes} onChange={v => { setFilterMake(v); setVisibleCount(ITEMS_PER_BATCH); }} />
                            <FilterSelect label="Year" value={filterYear} options={years} onChange={v => { setFilterYear(v); setVisibleCount(ITEMS_PER_BATCH); }} />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <FilterSelect label="Transmission" value={filterTransmission} options={transmissions as any} onChange={v => { setFilterTransmission(v); setVisibleCount(ITEMS_PER_BATCH); }} />
                            <FilterSelect 
                                label="Condition" 
                                value={filterCondition === "All" ? "All" : filterCondition.replace('_', ' ')} 
                                options={conditions.map(c => c === "All" ? "All" : c.replace('_', ' '))} 
                                onChange={v => { 
                                    setFilterCondition(v === "All" ? "All" : conditions.find(cond => cond.replace('_', ' ') === v) || v); 
                                    setVisibleCount(ITEMS_PER_BATCH); 
                                }} 
                            />
                        </div>

                        {hasActiveFilters && (
                            <div className="active-chips">
                                {chips.map((chip, i) => (
                                    <button key={i} className="filter-chip" onClick={chip.clear}>
                                        {chip.label}
                                        <span className="filter-chip-x">×</span>
                                    </button>
                                ))}
                                <button className="reset-btn" onClick={() => {
                                    setFilterMake("All");
                                    setFilterYear("All");
                                    setSearchQuery("");
                                }}>
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {isInitialLoading ? (
                <SkeletonGrid />
            ) : visibleAuctions.length === 0 ? (
                <div className="empty-state">
                    <h3>No vehicles found</h3>
                    <p>Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <div className="auction-grid">
                    {visibleAuctions.map((auction) => (
                        <div key={auction.id} className="fade-in-item">
                            <AuctionCard auction={auction} viewMode="grid" />
                        </div>
                    ))}
                    <div ref={sentinelRef} style={{ height: "20px", width: "100%", gridColumn: "1 / -1" }} />
                </div>
            )}

            {hasMore && <div className="scroll-loader">Loading more…</div>}
        </div>
    );
});