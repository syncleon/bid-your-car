import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllItems,
    submitItem,
    getMyItems,
    deleteItem,
    updateItem,
    uploadItemImage // ✅ Import the new API method
} from "../api/item.api";
import type { ItemDto, ItemSubmitRequest } from "../types";

class ItemStore {
    items: ItemDto[] = [];      // Public items
    myItems: ItemDto[] = [];    // User's private items
    isLoading = false;
    error: string | null = null;

    // ✅ New state to track image uploading status
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

    updateListing = async (id: string, data: ItemSubmitRequest) => {
        this.isLoading = true;
        try {
            const updated = await updateItem(id, data);
            runInAction(() => {
                const index = this.myItems.findIndex(i => i.id === id);
                if (index !== -1) {
                    this.myItems[index] = updated;
                }
                this.isLoading = false;
            });
            return true;
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Failed to update item";
                this.isLoading = false;
            });
            return false;
        }
    };

    // ✅ UPDATED: Accepts files alongside the data
    submitItem = async (data: ItemSubmitRequest, files: File[]) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Creating listing...";

        try {
            // 1. Create the Item (JSON)
            const newItem = await submitItem(data);

            // 2. Upload Images (if any)
            if (files.length > 0) {
                const itemId = newItem.id;

                // Upload sequentially to avoid network timeouts on large files
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
            return true; // Success

        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Something went wrong";
                this.isLoading = false;
                this.uploadProgress = null;
            });
            return false; // Failed
        }
    };
}

export const itemStore = new ItemStore();