import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllItems,
    submitItem,
    getMyItems,
    deleteItem,
    updateItem,
    uploadItemImage,
    deleteImage as apiDeleteImage
} from "../api/item.api";
import type { ItemDto, ItemCreateRequest } from "../types";

class ItemStore {
    items: ItemDto[] = [];
    myItems: ItemDto[] = [];
    isLoading = false;
    error: string | null = null;
    uploadProgress: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // --- Data Loading ---

    loadItems = async () => {
        this.isLoading = true;
        this.error = null;
        try {
            const data = await getAllItems();
            runInAction(() => {
                this.items = data;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load items";
                this.isLoading = false;
            });
        }
    };

    loadMyItems = async () => {
        this.isLoading = true;
        this.error = null;
        try {
            const data = await getMyItems();
            runInAction(() => {
                this.myItems = data;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load your items";
                this.isLoading = false;
            });
        }
    };

    // --- Actions ---

    submitItem = async (data: ItemCreateRequest, files: File[]) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Initializing listing...";

        try {
            // 1. Create the Item record first (Kotlin backend)
            const newItem = await submitItem(data);
            const itemId = newItem.id;

            // 2. Sequential Upload (Avoids overwhelming the S3/API connection)
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Uploading photo ${i + 1} of ${files.length}...`;
                    });
                    await uploadItemImage(itemId, files[i]);
                }
            }

            runInAction(() => {
                this.isLoading = false;
                this.uploadProgress = null;
            });
            // Refresh local items to show the new listing with its images
            await this.loadMyItems();
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to create listing";
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return false;
        }
    };

    updateListing = async (id: string, data: ItemCreateRequest, newFiles: File[]) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Saving changes...";

        try {
            // 1. Update text metadata (Year, Mileage, VIN, etc.)
            const updatedItem = await updateItem(id, data);

            // 2. Process new image uploads if any
            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Adding photo ${i + 1} of ${newFiles.length}...`;
                    });
                    await uploadItemImage(id, newFiles[i]);
                }
                // Refresh to get new CDN URLs for the images
                await this.loadMyItems();
            } else {
                runInAction(() => {
                    const index = this.myItems.findIndex(i => i.id === id);
                    if (index !== -1) this.myItems[index] = updatedItem;
                });
            }

            runInAction(() => {
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Update failed";
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return false;
        }
    };

    deleteListing = async (id: string) => {
        try {
            await deleteItem(id);
            runInAction(() => {
                this.myItems = this.myItems.filter(item => item.id !== id);
                this.items = this.items.filter(item => item.id !== id);
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to delete item";
            });
        }
    };

    deleteImage = async (itemId: string, imageId: string) => {
        try {
            await apiDeleteImage(imageId);
            runInAction(() => {
                // Optimistically update the store to remove image from UI immediately
                const item = this.myItems.find(i => i.id === itemId) || this.items.find(i => i.id === itemId);
                if (item) {
                    item.images = item.images.filter(img => img.id !== imageId);
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = "Failed to remove image";
            });
        }
    };
}

export const itemStore = new ItemStore();