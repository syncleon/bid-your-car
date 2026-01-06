import { makeAutoObservable, runInAction } from "mobx";
import { getAllItems, submitItem, getMyItems, deleteItem, updateItem } from "../api/item.api";
import type { ItemDto, ItemSubmitRequest } from "../types";

class ItemStore {
    items: ItemDto[] = [];      // Public items
    myItems: ItemDto[] = [];    // User's private items
    isLoading = false;
    error: string | null = null;

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
                // Optimistically remove from local state
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
                // Find and replace the item in the list
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

    submitItem = async (data: ItemSubmitRequest) => {
        this.isLoading = true;
        this.error = null;

        try {
            await submitItem(data);
            runInAction(() => {
                this.isLoading = false;
            });
            return true; // Success
        } catch (err: any) {
            runInAction(() => {
                this.error = err.message || "Something went wrong";
                this.isLoading = false;
            });
            return false; // Failed
        }
    };
}

export const itemStore = new ItemStore();