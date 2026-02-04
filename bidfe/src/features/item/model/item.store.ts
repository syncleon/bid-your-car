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

    // Pagination State
    totalItems = 0;
    totalPages = 0;
    currentPage = 0;

    isLoading = false;
    error: string | null = null;
    uploadProgress: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // --- Data Loading ---

    loadItems = async (page = 0) => {
        this.isLoading = true;
        this.error = null;
        try {
            // API returns Page<ItemDto>
            const pageData = await getAllItems(page);

            runInAction(() => {
                // We extract the array from the 'content' field
                this.items = pageData.content;

                // Update pagination state
                this.totalItems = pageData.totalElements;
                this.totalPages = pageData.totalPages;
                this.currentPage = pageData.number;

                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load items";
                this.isLoading = false;
            });
        }
    };

    loadMyItems = async (page = 0) => {
        this.isLoading = true;
        this.error = null;
        try {
            const pageData = await getMyItems(page);
            runInAction(() => {
                this.myItems = pageData.content;
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
            const newItem = await submitItem(data);
            const itemId = newItem.id;

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

            // Reload user items to reflect changes
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
            const updatedItem = await updateItem(id, data);

            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Adding photo ${i + 1} of ${newFiles.length}...`;
                    });
                    await uploadItemImage(id, newFiles[i]);
                }
                await this.loadMyItems(); // Full refresh if images added
            } else {
                runInAction(() => {
                    // Optimistic update for text-only changes
                    const index = this.myItems.findIndex(i => i.id === id);
                    if (index !== -1) {
                        // We preserve existing images since the update response might lazily load them
                        const existingImages = this.myItems[index].images;
                        this.myItems[index] = { ...updatedItem, images: existingImages };
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