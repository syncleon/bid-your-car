import { makeAutoObservable, runInAction } from "mobx";
import {
    getAllItems,
    getItemById,
    submitItem,
    getMyItems,
    deleteItem,
    updateItem,
    uploadItemImage
} from "../api/item.api";
import type {ItemDto, ItemCreateRequest, ItemUpdateRequest} from "../types";

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

                // Set selectedItem so the Page component can navigate to it
                this.selectedItem = newItem;

                // Add to the beginning of the local list
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

    updateListing = async (
        id: string,
        data: ItemUpdateRequest,
        newFiles: File[],
        deletedImageIds: string[] = []
    ) => {
        this.isLoading = true;
        this.error = null;
        this.uploadProgress = "Saving changes...";

        try {
            // 1️⃣ Calculate keepImageIds (backend-driven sync)
            const keepImageIds =
                this.selectedItem?.images
                    .filter(img => !deletedImageIds.includes(img.id))
                    .map(img => img.id) || [];

            // 2️⃣ Send update request with keepImageIds
            const updatedItem = await updateItem(id, {
                ...data,
                keepImageIds
            });

            // 3️⃣ Upload new images (if any)
            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    runInAction(() => {
                        this.uploadProgress = `Adding photo ${i + 1} of ${newFiles.length}...`;
                    });

                    await uploadItemImage(id, newFiles[i]);
                }
            }

            // 4️⃣ Always reload if images changed
            if (newFiles.length > 0 || deletedImageIds.length > 0) {
                await this.loadItemDetails(id);

                runInAction(() => {
                    const updateInList = (list: ItemDto[]) => {
                        const index = list.findIndex(i => i.id === id);
                        if (index !== -1 && this.selectedItem) {
                            list[index] = { ...this.selectedItem };
                        }
                    };

                    updateInList(this.myItems);
                    updateInList(this.items);
                });

            } else {
                // Fast path (text only)
                runInAction(() => {
                    const updateInList = (list: ItemDto[]) => {
                        const index = list.findIndex(i => i.id === id);
                        if (index !== -1) {
                            const existingImages = list[index].images;
                            list[index] = { ...updatedItem, images: existingImages };
                        }
                    };

                    updateInList(this.myItems);
                    updateInList(this.items);

                    if (this.selectedItem?.id === id) {
                        this.selectedItem = {
                            ...updatedItem,
                            images: this.selectedItem.images
                        };
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
}

export const itemStore = new ItemStore();