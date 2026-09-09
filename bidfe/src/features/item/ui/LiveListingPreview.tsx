
import type { ConditionGrade } from "../types";
import { Car } from "lucide-react";

interface LiveListingPreviewProps {
    formData: {
        year: number | string;
        make: string;
        model: string;
        mileage: number | string;
        location: string;
        condition: ConditionGrade;
        transmission: string;
        drivetrain: string;
        fuelType: string;
        bodyStyle: string;
        engine: string;
        horsepower: number | string;
        exteriorColor: string;
        interiorColor: string;
        titleStatus: string;
        description: string;
    };
    previewImage: string | null;
}

export const LiveListingPreview = ({ formData, previewImage }: LiveListingPreviewProps) => {
    const hasVehicleDetails = formData.make || formData.model;
    const displayYear = formData.year ? Number(formData.year) : new Date().getFullYear();

    const renderBadge = (label: string, value: string | number | undefined, icon?: React.ReactNode) => {
        if (!value) return null;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {icon} <span style={{ opacity: 0.5, marginRight: '2px' }}>{label}:</span> {value}
            </div>
        );
    };

    return (
        <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', perspective: '1000px' }}>
            <div style={{
                padding: '16px',
                background: '#111111',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.4s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</span>
                    </div>
                    {formData.location && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{formData.location}</span>}
                </div>

                <div style={{ 
                    position: 'relative', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    background: '#111', 
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {previewImage ? (
                        <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ opacity: 0.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Car size={48} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Awaiting Photos</span>
                        </div>
                    )}


                    {formData.mileage !== "" && (
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)', zIndex: 10 }}>
                            {Number(formData.mileage).toLocaleString()} mi
                        </div>
                    )}
                </div>

                <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: 'white', lineHeight: '1.2' }}>
                        {hasVehicleDetails 
                            ? `${displayYear} ${formData.make} ${formData.model}`.trim()
                            : "Vehicle Details Pending"}
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {renderBadge("Condition", formData.condition?.replace('_', ' '))}
                        {renderBadge("Title", formData.titleStatus)}
                        {renderBadge("Body", formData.bodyStyle)}
                        {renderBadge("Color", formData.exteriorColor)}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            {formData.engine && <span><strong style={{color:'white'}}>Engine:</strong> {formData.engine}</span>}
                            {formData.transmission && <span><strong style={{color:'white'}}>Trans:</strong> {formData.transmission}</span>}
                            {formData.drivetrain && <span><strong style={{color:'white'}}>Drive:</strong> {formData.drivetrain}</span>}
                        </div>
                        {formData.description && (
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                "{formData.description}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
