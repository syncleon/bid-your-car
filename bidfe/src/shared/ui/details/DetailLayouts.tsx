import React from "react";
import { styles, minStyles } from "./sharedStyles";

export const DetailPageLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="page-container" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", color: "var(--text-primary)", transition: "color 0.3s ease" }}>{children}</div>
);

export const DetailHeader = ({ onBack, title }: { onBack: () => void, title?: string }) => (
    <div style={styles.headerRow}>
        <button onClick={onBack} style={minStyles.textBtn}>
            &larr; {title || "Back"}
        </button>
    </div>
);

export const SidebarCard = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div style={styles.card}>
        {title && <div style={styles.cardTitle}>{title}</div>}
        {children}
    </div>
);

export const ResponsiveGrid = ({ children, hasSidebar = true }: { children: React.ReactNode, hasSidebar?: boolean }) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 900);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div style={{
            ...styles.grid,
            gridTemplateColumns: isMobile || !hasSidebar ? "1fr" : "1fr 340px",
            gap: isMobile ? "32px" : "48px"
        }}>
            {children}
        </div>
    );
};

export const DetailSkeleton = () => (
    <DetailPageLayout>
        <DetailHeader onBack={() => {}} title="Loading..." />
        <ResponsiveGrid>
            <div>
                <div className="gallery-container">
                    <div style={{...styles.mainWrapper, backgroundColor: "var(--bg-input)"}} className="shimmer" />
                    <div className="thumb-grid">
                        {Array.from({length: 6}).map((_, i) => (
                            <div key={i} style={{...styles.thumbWrapper, backgroundColor: "var(--bg-input)"}} className="shimmer" />
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ height: 36, width: "60%", backgroundColor: "var(--bg-input)", borderRadius: 4 }} className="shimmer" />
                    <div style={{ height: 20, width: "40%", backgroundColor: "var(--bg-input)", borderRadius: 4 }} className="shimmer" />
                    <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px" }}>
                        {Array.from({length: 10}).map((_, i) => (
                            <div key={i} style={{ height: 24, backgroundColor: "var(--bg-input)", borderRadius: 4 }} className="shimmer" />
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <SidebarCard>
                    <div style={{ height: 20, width: "50%", backgroundColor: "var(--bg-input)", borderRadius: 4, marginBottom: 16 }} className="shimmer" />
                    <div style={{ height: 60, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 4, marginBottom: 16 }} className="shimmer" />
                    <div style={{ height: 48, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 4, marginBottom: 12 }} className="shimmer" />
                    <div style={{ height: 48, width: "100%", backgroundColor: "var(--bg-input)", borderRadius: 4 }} className="shimmer" />
                </SidebarCard>
            </div>
        </ResponsiveGrid>
    </DetailPageLayout>
);
