import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ItemDto, ItemUpdateRequest, ImageCategory } from '../types';
import { useStore } from '../../../shared/hooks/useStore';


interface Props {
    item: ItemDto;
    onCancel: () => void;
    onSaveSuccess: () => void;
}

export const InlineItemEditor = ({ item, onCancel, onSaveSuccess }: Props) => {
    const { itemStore } = useStore();
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<Partial<ItemUpdateRequest>>({
        year: item.year,
        make: item.make,
        model: item.model,
        mileage: item.mileage,
        engine: item.engine || '',
        transmission: item.transmission || '',
        drivetrain: item.drivetrain || '',
        bodyStyle: item.bodyStyle || '',
        exteriorColor: item.exteriorColor || '',
        interiorColor: item.interiorColor || '',
        titleStatus: item.titleStatus || '',
        sellerType: item.sellerType || '',
        location: item.location || '',
        description: item.description || '',
    });

    const [existingImages, setExistingImages] = useState([...item.images].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    const [newFiles, setNewFiles] = useState<{ file: File; category: ImageCategory }[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newImages = [...existingImages];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);
        
        setExistingImages(newImages);
        setDraggedIndex(index); // update dragged index to new position so we can keep dragging
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let parsed = value;
            if (['year', 'mileage'].includes(name)) parsed = value ? Number(value) as any : '';
            if (name === 'vin') parsed = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            return { ...prev, [name]: parsed };
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const added = Array.from(e.target.files);
            setNewFiles(prev => [...prev, ...added.map(f => ({ file: f, category: 'EXTERIOR' as ImageCategory }))]);
            setNewPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))]);
        }
    };

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setNewPreviews(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index]);
            copy.splice(index, 1);
            return copy;
        });
    };

    const removeExistingImage = (id: string) => {
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const keepImageIds = existingImages.map(img => img.id);
            await itemStore.updateListing(item.id, formData, newFiles, keepImageIds);
            onSaveSuccess();
        } catch (e) {
            console.error(e);
            alert("Failed to save. Check inputs.");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px', borderRadius: '6px', 
        border: '1px solid var(--border-color)', background: 'var(--bg-input)', 
        color: 'var(--text-primary)', fontSize: '14px'
    };
    
    const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Vehicle Photos</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                    {existingImages.map((img, idx) => (
                        <div 
                            key={img.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            style={{ 
                                position: 'relative', 
                                aspectRatio: '4/3', 
                                borderRadius: '6px', 
                                overflow: 'hidden',
                                opacity: draggedIndex === idx ? 0.5 : 1,
                                cursor: 'grab',
                                border: idx === 0 ? '2px solid var(--color-primary)' : 'none'
                            }}
                        >
                            {idx === 0 && <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '6px', zIndex: 10, fontWeight: 'bold' }}>MAIN</div>}
                            <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Vehicle" />
                            <button onClick={() => removeExistingImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
                        </div>
                    ))}
                    
                    {newPreviews.map((url, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '2px dashed var(--color-primary)' }}>
                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="New Upload" />
                            <button onClick={() => removeNewFile(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                    ))}

                    <label style={{ aspectRatio: '4/3', borderRadius: '6px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '24px' }}>+</span>
                        <span style={{ fontSize: '12px' }}>Add Photos</span>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Vehicle Details</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>VIN</label>
                        <input name="vin" value={item.vin} readOnly disabled style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Mileage</label>
                        <input name="mileage" type="number" value={formData.mileage} onChange={handleChange} style={inputStyle} />
                    </div>
                    
                    <div>
                        <label style={labelStyle}>Make</label>
                        <input name="make" value={formData.make} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Model</label>
                        <input name="model" value={formData.model} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Year</label>
                        <input name="year" type="number" value={formData.year} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Title Status</label>
                        <select name="titleStatus" value={formData.titleStatus} onChange={handleChange} style={inputStyle}>
                            <option value="">Select...</option>
                            <option value="CLEAN">Clean</option>
                            <option value="SALVAGE">Salvage</option>
                            <option value="REBUILT">Rebuilt</option>
                            <option value="LIEN">Lien</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Engine</label>
                        <input name="engine" value={formData.engine} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Transmission</label>
                        <select name="transmission" value={formData.transmission} onChange={handleChange} style={inputStyle}>
                            <option value="">Select...</option>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Drivetrain</label>
                        <select name="drivetrain" value={formData.drivetrain} onChange={handleChange} style={inputStyle}>
                            <option value="">Select...</option>
                            <option value="RWD">RWD</option>
                            <option value="FWD">FWD</option>
                            <option value="AWD">AWD</option>
                            <option value="4WD">4WD</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Body Style</label>
                        <input name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Exterior Color</label>
                        <input name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Interior Color</label>
                        <input name="interiorColor" value={formData.interiorColor} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Location (City, State)</label>
                        <input name="location" value={formData.location} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Description & Highlights</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                    <button onClick={onCancel} disabled={saving} style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
