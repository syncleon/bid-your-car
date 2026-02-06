import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllItems,
    getItemById,
    submitItem,
    getMyItems,
    deleteItem,
    updateItem,
    uploadItemImage,
    deleteImage as apiDeleteImage
} from "../api/item.api";
import type { ItemDto, ItemCreateRequest } from "../types";

export class ItemStore {
    items: ItemDto[] = [];
    myItems: ItemDto[] = [];
    selectedItem: ItemDto | null = null; // Used for Details View & Navigation

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
            const pageData = await getAllItems(page);
            runInAction(() => {
                this.items = pageData.content;
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

    loadItemDetails = async (id: string) => {
        this.isLoading = true;
        this.error = null;
        try {
            const item = await getItemById(id);
            runInAction(() => {
                this.selectedItem = item;
                this.isLoading = false;
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to load item details";
                this.isLoading = false;
            });
        }
    };

    clearSelectedItem = () => {
        this.selectedItem = null;
    };

    // --- Actions ---

    submitItem = async (data: ItemCreateRequest, files: File[]) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Initializing listing...";

        try {
            // 1. Create the item
            const newItem = await submitItem(data);
            const itemId = newItem.id;

            // 2. Upload images if any
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Uploading photo ${i + 1} of ${files.length}...`;
                    });
                    await uploadItemImage(itemId, files[i]);
                }
            }

            // 3. Update State
            runInAction(() => {
                this.isLoading = false;
                this.uploadProgress = null;

                // ✅ CRITICAL FIX: Set selectedItem so the Page component can navigate to it
                this.selectedItem = newItem;

                // Optional: Add to the beginning of the local list to avoid a re-fetch
                this.myItems.unshift(newItem);
            });

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
                // If we uploaded files, we should reload the item to get new image URLs
                await this.loadItemDetails(id);
            } else {
                runInAction(() => {
                    // Update local lists
                    const updateInList = (list: ItemDto[]) => {
                        const index = list.findIndex(i => i.id === id);
                        if (index !== -1) {
                            // Preserve existing images since we didn't upload new ones
                            const existingImages = list[index].images;
                            list[index] = { ...updatedItem, images: existingImages };
                        }
                    };

                    updateInList(this.myItems);
                    updateInList(this.items);

                    // Update selectedItem if it matches
                    if (this.selectedItem?.id === id) {
                        this.selectedItem = { ...updatedItem, images: this.selectedItem.images };
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

                if (this.selectedItem?.id === id) {
                    this.selectedItem = null;
                }
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
                // Helper to remove image from an item
                const removeImg = (item: ItemDto) => {
                    item.images = item.images.filter(img => img.id !== imageId);
                };

                // Update lists
                const inMyItems = this.myItems.find(i => i.id === itemId);
                if (inMyItems) removeImg(inMyItems);

                const inItems = this.items.find(i => i.id === itemId);
                if (inItems) removeImg(inItems);

                // Update currently selected item
                if (this.selectedItem?.id === itemId) {
                    removeImg(this.selectedItem);
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