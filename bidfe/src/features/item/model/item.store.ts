import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllItems,
    submitItem,
    getMyItems,
    deleteItem,
    updateItem,
    uploadItemImage,
    deleteImage as apiDeleteImage // ✅ Import this (ensure it exists in api/item.api.ts)
} from "../api/item.api";
import type { ItemDto, ItemSubmitRequest } from "../types";

class ItemStore {
    items: ItemDto[] = [];      // Public items
    myItems: ItemDto[] = [];    // User's private items
    isLoading = false;
    error: string | null = null;
    uploadProgress: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

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

    deleteListing = async (id: string) => {
        try {
            await deleteItem(id);
            runInAction(() => {
                this.myItems = this.myItems.filter(item => item.id !== id);
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to delete item";
            });
        }
    };

    // ✅ UPDATED: Now handles Text Update + New File Uploads
    updateListing = async (id: string, data: ItemSubmitRequest, newFiles: File[]) => {
        this.isLoading = true;
        this.uploadProgress = "Updating details...";

        try {
            // 1. Update text data (Make, Model, Price, etc.)
            const updatedItem = await updateItem(id, data);

            // 2. Upload NEW images (if any)
            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Uploading new photo ${i + 1} of ${newFiles.length}...`;
                    });
                    // Upload to server
                    await uploadItemImage(id, newFiles[i]);
                }

                // 3. IMPORTANT: Reload "My Items" to get the fresh image URLs from the server
                // The 'updatedItem' from step 1 doesn't know about the images we just uploaded in step 2.
                await this.loadMyItems();
            } else {
                // If no new files, just update the local state immediately
                runInAction(() => {
                    const index = this.myItems.findIndex(i => i.id === id);
                    if (index !== -1) {
                        this.myItems[index] = updatedItem;
                    }
                });
            }

            runInAction(() => {
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to update item";
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return false;
        }
    };

    // ✅ NEW: Handle deleting a single image
    deleteImage = async (itemId: string, imageId: string) => {
        try {
            // 1. Call API to delete from Server/S3
            await apiDeleteImage(imageId);

            runInAction(() => {
                // 2. Optimistically remove from local UI
                const item = this.myItems.find(i => i.id === itemId);
                if (item) {
                    item.images = item.images.filter(img => img.id !== imageId);
                }
            });
        } catch (err: any) {
            runInAction(() => {
                console.error("Failed to delete image", err);
                this.error = "Failed to delete image";
            });
        }
    };

    submitItem = async (data: ItemSubmitRequest, files: File[]) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Creating listing...";

        try {
            const newItem = await submitItem(data);

            if (files.length > 0) {
                const itemId = newItem.id;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    runInAction(() => {
                        this.uploadProgress = `Uploading image ${i + 1} of ${files.length}...`;
                    });
                    await uploadItemImage(itemId, file);
                }
            }

            runInAction(() => {
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Something went wrong";
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return false;
        }
    };
}

export const itemStore = new ItemStore();