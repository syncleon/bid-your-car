import { useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { auctionStore } from "../features/auction/model/auction.store";
import { AuctionCard } from "../features/auction/ui/AuctionCard";
import type { AuctionDto } from "../features/auction/types";

export const AuctionPage = observer(() => {
    // --- Local Filter State ---
    const [filterMake, setFilterMake] = useState<string>("All");
    const [filterYear, setFilterYear] = useState<string>("All");
    const [sortBy, setSortBy] = useState<string>("ending_soon");

    useEffect(() => {
        auctionStore.loadAuctions("ACTIVE");
    }, []);

    const allAuctions = auctionStore.auctions;

    // --- 1. Compute Unique Options based on available data ---
    const makes = useMemo(() => {
        const unique = new Set(allAuctions.map(a => a.item.make));
        return ["All", ...Array.from(unique).sort()];
    }, [allAuctions]);

    const years = useMemo(() => {
        const unique = new Set(allAuctions.map(a => a.item.year));
        return ["All", ...Array.from(unique).sort().reverse()];
    }, [allAuctions]);

    // --- 2. Filter & Sort Logic ---
    const filteredAuctions = useMemo(() => {
        let result = [...allAuctions];

        // Apply Make Filter
        if (filterMake !== "All") {
            result = result.filter(a => a.item.make === filterMake);
        }

        // Apply Year Filter
        if (filterYear !== "All") {
            result = result.filter(a => a.item.year.toString() === filterYear);
        }

        // Apply Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case "newly_listed":
                    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
                case "price_low":
                    return (a.currentHighestBid ?? a.startPrice) - (b.currentHighestBid ?? b.startPrice);
                case "price_high":
                    return (b.currentHighestBid ?? b.startPrice) - (a.currentHighestBid ?? a.startPrice);
                case "ending_soon":
                default:
                    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
            }
        });

        return result;
    }, [allAuctions, filterMake, filterYear, sortBy]);


    // --- Loading / Error States ---
    if (auctionStore.isLoading && allAuctions.length === 0) {
        return <div style={styles.centerMessage}>Loading live auctions...</div>;
    }

    if (auctionStore.error) {
        return <div style={{...styles.centerMessage, color: "#dc2626"}}>Error: {auctionStore.error}</div>;
    }

    return (
        <div style={styles.container}>

            {/* Header Section */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Live Auctions</h1>
                    <p style={styles.subtitle}>
                        {filteredAuctions.length} {filteredAuctions.length === 1 ? 'vehicle' : 'vehicles'} found
                    </p>
                </div>

                {/* Filter Toolbar */}
                <div style={styles.filterBar}>
                    {/* Make Filter */}
                    <div style={styles.selectWrapper}>
                        <label style={styles.label}>Make</label>
                        <select
                            value={filterMake}
                            onChange={e => setFilterMake(e.target.value)}
                            style={styles.select}
                        >
                            {makes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div style={styles.selectWrapper}>
                        <label style={styles.label}>Year</label>
                        <select
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            style={styles.select}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* Sort By */}
                    <div style={styles.selectWrapper}>
                        <label style={styles.label}>Sort By</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={styles.select}
                        >
                            <option value="ending_soon">Ending Soonest</option>
                            <option value="newly_listed">Newly Listed</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Reset Button (Only show if filters active) */}
                    {(filterMake !== "All" || filterYear !== "All") && (
                        <button
                            onClick={() => { setFilterMake("All"); setFilterYear("All"); }}
                            style={styles.resetBtn}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </header>

            {/* Grid Section */}
            {filteredAuctions.length === 0 ? (
                <div style={styles.emptyState}>
                    <h3>No vehicles match your filters</h3>
                    <p>Try adjusting your search criteria.</p>
                    <button
                        onClick={() => { setFilterMake("All"); setFilterYear("All"); }}
                        style={styles.resetLink}
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div style={styles.grid}>
                    {filteredAuctions.map((auction: AuctionDto) => (
                        <AuctionCard
                            key={auction.id}
                            auction={auction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

const styles = {
    container: { padding: "40px 24px", maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" },

    // Header Layout
    header: {
        marginBottom: "40px",
        paddingBottom: "24px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexWrap: "wrap" as const,
        justifyContent: "space-between",
        alignItems: "end",
        gap: "24px"
    },
    title: { fontSize: "28px", fontWeight: 800, color: "#111", margin: "0 0 4px 0", letterSpacing: "-0.5px" },
    subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },

    // Filters
    filterBar: { display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" as const },
    selectWrapper: { display: "flex", flexDirection: "column" as const, gap: "4px" },
    label: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, color: "#9ca3af", letterSpacing: "0.5px" },
    select: {
        padding: "10px 36px 10px 12px",
        fontSize: "14px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: "#fff",
        color: "#1f2937",
        fontWeight: 500,
        cursor: "pointer",
        outline: "none",
        minWidth: "140px",
        appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px top 50%",
        backgroundSize: "8px auto",
    },
    resetBtn: { padding: "10px 16px", fontSize: "13px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, height: "42px" },

    // Grid & States
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "40px 32px", alignItems: "start" },
    emptyState: { textAlign: "center" as const, marginTop: 80, color: "#6b7280", padding: "40px", background: "#f9fafb", borderRadius: "12px" },
    centerMessage: { padding: 60, textAlign: "center" as const, color: "#999", fontSize: "14px" },
    resetLink: { marginTop: "16px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }
};