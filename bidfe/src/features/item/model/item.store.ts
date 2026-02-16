import { types, flow, cast, type Instance } from "mobx-state-tree";
import {
    getAllItems,
    getMyItems,
    getItemById,
    submitItem,
    deleteItem,
    updateItem,
    uploadItemImage
} from "../api/item.api";
import type {
    AuctionStatus,
    ItemCreateRequest,
    ItemDto,
    ItemStatus,
    ItemUpdateRequest
} from "../types.ts";
import type { AuctionDto } from "../../auction/types.ts";
import type { UserDto } from "../../auth/types.ts";

const ItemImageModel = types.model("ItemImage", {
    id: types.identifier,
    url: types.string,
    sortOrder: types.number,
});

export const ItemModel = types.model("Item", {
    id: types.identifier,
    status: types.enumeration<ItemStatus>([
        "DRAFT",
        "SOLD",
        "ARCHIVED",
        "ACTIVE_AUCTION"
    ]),
    year: types.number,
    make: types.string,
    model: types.string,
    vin: types.string,
    location: types.string,
    mileage: types.number,
    description: types.maybeNull(types.string),
    thumbnailUrl: types.maybeNull(types.string),

    seller: types.frozen<UserDto>(),

    // Technical Specs
    engine: types.maybeNull(types.string),
    drivetrain: types.maybeNull(types.string),
    transmission: types.maybeNull(types.string),
    bodyStyle: types.maybeNull(types.string),
    exteriorColor: types.maybeNull(types.string),
    interiorColor: types.maybeNull(types.string),
    sellerType: types.maybeNull(types.string),

    images: types.array(ItemImageModel),

    // Auction Context
    auctionStatus: types.maybeNull(
        types.enumeration<AuctionStatus>([
            "DRAFT",
            "PENDING_APPROVAL",
            "SCHEDULED",
            "ACTIVE",
            "ENDED_PENDING",
            "SOLD",
            "UNSOLD",
            "CANCELLED"
        ])
    ),
    activeAuctionId: types.maybeNull(types.string),
    auction: types.maybeNull(types.frozen<AuctionDto>())
});

// --- Root Store ---

export const ItemStore = types
    .model("ItemStore", {
        items: types.array(ItemModel),
        myItems: types.array(ItemModel),
        selectedItem: types.maybeNull(types.reference(ItemModel)),

        // Pagination for all items
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,

        // Pagination for my items
        myTotalItems: 0,
        myTotalPages: 0,
        myCurrentPage: 0,
    })
    .volatile(() => ({
        isLoading: false,
        error: null as string | null,
        uploadProgress: null as string | null,
    }))

    .views((self) => ({
        get hasItems() {
            return self.items.length > 0;
        },
        get hasMyItems() {
            return self.myItems.length > 0;
        },
        getItemById(id: string) {
            return self.items.find(i => i.id === id) || self.myItems.find(i => i.id === id);
        }
    }))
    .actions((self) => {
        // Private helper to sync lists
        const updateLocalCache = (itemData: ItemDto) => {
            const existingInItems = self.items.findIndex(i => i.id === itemData.id);
            if (existingInItems !== -1) self.items[existingInItems] = cast(itemData);

            const existingInMyItems = self.myItems.findIndex(i => i.id === itemData.id);
            if (existingInMyItems !== -1) self.myItems[existingInMyItems] = cast(itemData);
        };

        const loadItems = flow(function* (page = 0) {
            self.isLoading = true;
            self.error = null;
            try {
                const data = yield getAllItems(page);
                self.items = cast(data.content);
                self.totalItems = data.totalElements;
                self.totalPages = data.totalPages;
                self.currentPage = data.number;
            } catch (err) { // <-- Removed any
                self.error = err instanceof Error ? err.message : "Failed to load items";
            } finally {
                self.isLoading = false;
            }
        });

        const loadItemDetails = flow(function* (id: string) {
            self.isLoading = true;
            self.error = null;
            try {
                // Fetch the fresh item from the API
                const itemData = yield getItemById(id);

                // Keep our local lists in sync
                updateLocalCache(itemData);

                // If the item isn't in our arrays yet, we need to push it so the reference works
                const exists = self.items.find(i => i.id === id) || self.myItems.find(i => i.id === id);
                if (!exists) {
                    self.items.push(cast(itemData));
                }

                // Set it as the currently selected item
                self.selectedItem = id as unknown as Instance<typeof ItemModel>;
            } catch (err) {
                self.error = err instanceof Error ? err.message : "Failed to load item details";
            } finally {
                self.isLoading = false;
            }
        });

        const clearSelectedItem = () => {
            self.selectedItem = null;
        };

        const loadMyItems = flow(function* (page = 0) {
            self.isLoading = true;
            self.error = null;
            try {
                const data = yield getMyItems(page);
                self.myItems = cast(data.content);
                self.myTotalItems = data.totalElements;
                self.myTotalPages = data.totalPages;
                self.myCurrentPage = data.number;
            } catch (err) { // <-- Removed any
                self.error = err instanceof Error ? err.message : "Failed to load your items";
            } finally {
                self.isLoading = false;
            }
        });

        const submitNewItem = flow(function* (data: ItemCreateRequest, files: File[]) {
            self.isLoading = true;
            self.uploadProgress = "Creating listing...";
            try {
                const newItem: ItemDto = yield submitItem(data);

                if (files.length > 0) {
                    self.uploadProgress = `Uploading ${files.length} images...`;
                    yield Promise.all(files.map(file => uploadItemImage(newItem.id, file)));

                    const finalItem: ItemDto = yield getItemById(newItem.id);
                    self.myItems.unshift(cast(finalItem));

                    // FIX: Replaced `as any` with a double assertion to bypass ESLint complaints
                    self.selectedItem = finalItem.id as unknown as Instance<typeof ItemModel>;
                    return finalItem;
                }

                self.myItems.unshift(cast(newItem));

                // FIX: Replaced `as any`
                self.selectedItem = newItem.id as unknown as Instance<typeof ItemModel>;
                return newItem;
            } catch (err) { // <-- Removed any
                self.error = err instanceof Error ? err.message : "Submit failed";
                return null;
            } finally {
                self.isLoading = false;
                self.uploadProgress = null;
            }
        });

        const updateListing = flow(function* (
            id: string,
            data: ItemUpdateRequest,
            newFiles: File[],
            deletedImageIds: string[]
        ) {
            self.isLoading = true;
            self.uploadProgress = "Updating...";
            try {
                const keepImageIds = self.selectedItem?.images
                    .filter(img => !deletedImageIds.includes(img.id))
                    .map(img => img.id) || [];

                yield updateItem(id, { ...data, keepImageIds });

                if (newFiles.length > 0) {
                    yield Promise.all(newFiles.map(file => uploadItemImage(id, file)));
                }

                const refreshed: ItemDto = yield getItemById(id);
                updateLocalCache(refreshed);
                return true;
            } catch (err) { // <-- Removed any
                self.error = err instanceof Error ? err.message : "Update failed";
                return false;
            } finally {
                self.isLoading = false;
                self.uploadProgress = null;
            }
        });

        const deleteListing = flow(function* (id: string) {
            try {
                yield deleteItem(id);

                const itemToRemove = self.items.find(i => i.id === id);
                if (itemToRemove) self.items.remove(itemToRemove);

                const myItemToRemove = self.myItems.find(i => i.id === id);
                if (myItemToRemove) self.myItems.remove(myItemToRemove);

                if (self.selectedItem?.id === id) self.selectedItem = null;
            } catch (err) { // <-- Removed any
                self.error = err instanceof Error ? err.message : "Delete failed";
            }
        });

        return {
            loadItems,
            loadMyItems,
            loadItemDetails,
            submitNewItem,
            updateListing,
            deleteListing,
            clearSelectedItem,
            setSelectedItem: (id: string | null) => {
                self.selectedItem = id as unknown as Instance<typeof ItemModel> | null;
            }
        };
    });

export type IItemStore = Instance<typeof ItemStore>;