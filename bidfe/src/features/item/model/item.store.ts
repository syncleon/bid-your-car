import { types, flow, cast, type Instance } from "mobx-state-tree";
import {
    getMyItems,
    getItemById,
    submitItem,
    deleteItem,
    updateItem,
    uploadItemImage
} from "../api/item.api";
import type {
    AuctionStatus,
    ConditionGrade,
    ImageCategory,
    ItemCreateRequest,
    ItemDto,
    ItemStatus,
    ItemUpdateRequest
} from "../types";
import type { AuctionDto } from "../../auction/types";
import type { UserDto } from "../../auth/types";

// --- Enums for MST ---
const ItemStatusEnum = types.enumeration<ItemStatus>("ItemStatus", [
    "DRAFT",
    "PENDING_AUCTION",
    "LISTED_AUCTION",
    "ACTIVE_AUCTION",
    "SOLD",
    "UNSOLD",
    "ARCHIVED"
]);

const AuctionStatusEnum = types.enumeration<AuctionStatus>("AuctionStatus", [
    "PENDING_APPROVAL",
    "SCHEDULED",
    "ACTIVE",
    "SOLD",
    "UNSOLD",
    "CANCELLED"
]);

const ConditionGradeEnum = types.enumeration<ConditionGrade>("ConditionGrade", [
    "EXCELLENT",
    "VERY_GOOD",
    "GOOD",
    "FAIR",
    "POOR",
    "PARTS_ONLY"
]);

const ImageCategoryEnum = types.enumeration<ImageCategory>("ImageCategory", [
    "MAIN",
    "EXTERIOR",
    "INTERIOR",
    "ENGINE",
    "SERVICE",
    "OTHER"
]);

// --- Models ---
const ItemImageModel = types.model("ItemImage", {
    id: types.identifier,
    url: types.string,
    category: ImageCategoryEnum,
    sortOrder: types.number,
});

export const ItemModel = types.model("Item", {
    id: types.identifier,
    status: ItemStatusEnum,
    year: types.number,
    make: types.string,
    model: types.string,
    vin: types.string,
    location: types.string,
    mileage: types.number,
    description: types.maybeNull(types.string),
    thumbnailUrl: types.maybeNull(types.string),

    seller: types.frozen<UserDto>(),

    // --- New Mechanical & Condition Fields ---
    fuelType: types.maybeNull(types.string),
    horsepower: types.maybeNull(types.number),
    condition: ConditionGradeEnum,
    titleStatus: types.maybeNull(types.string),
    isModified: types.boolean,
    hasServiceHistory: types.boolean,

    // --- New Pricing Logic ---
    reservePrice: types.maybeNull(types.number),
    isNoReserve: types.boolean,

    // --- Existing Technical Specs ---
    engine: types.maybeNull(types.string),
    drivetrain: types.maybeNull(types.string),
    transmission: types.maybeNull(types.string),
    bodyStyle: types.maybeNull(types.string),
    exteriorColor: types.maybeNull(types.string),
    interiorColor: types.maybeNull(types.string),
    sellerType: types.maybeNull(types.string),

    images: types.array(ItemImageModel),

    // --- Auction Context ---
    auctionStatus: types.maybeNull(AuctionStatusEnum),
    activeAuctionId: types.maybeNull(types.string),
    auction: types.maybeNull(types.frozen<AuctionDto>())
});

// --- Root Store ---

export const ItemStore = types
    .model("ItemStore", {
        // NOTE: 'items' (public list) is removed. The Item store now only manages the user's private garage.
        myItems: types.array(ItemModel),
        selectedItem: types.maybeNull(types.reference(ItemModel)),

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
        get hasMyItems() {
            return self.myItems.length > 0;
        },
        getItemById(id: string) {
            return self.myItems.find(i => i.id === id);
        }
    }))
    .actions((self) => {
        // Private helper to sync lists
        const updateLocalCache = (itemData: ItemDto) => {
            const existingInMyItems = self.myItems.findIndex(i => i.id === itemData.id);
            if (existingInMyItems !== -1) self.myItems[existingInMyItems] = cast(itemData);
        };

        const loadItemDetails = flow(function* (id: string) {
            self.isLoading = true;
            self.error = null;
            try {
                const itemData: ItemDto = yield getItemById(id);
                updateLocalCache(itemData);

                // If the item isn't in our array yet, we need to push it so the reference works
                const exists = self.myItems.find(i => i.id === id);
                if (!exists) {
                    self.myItems.push(cast(itemData));
                }

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
            } catch (err) {
                self.error = err instanceof Error ? err.message : "Failed to load your items";
            } finally {
                self.isLoading = false;
            }
        });

        // Updated to accept categories alongside files
        const submitNewItem = flow(function* (
            data: ItemCreateRequest,
            filesWithCategories: { file: File, category: ImageCategory }[]
        ) {
            self.isLoading = true;
            self.uploadProgress = "Creating listing...";
            try {
                const newItem: ItemDto = yield submitItem(data);

                if (filesWithCategories.length > 0) {
                    // SEQUENTIAL UPLOAD FIX:
                    for (let i = 0; i < filesWithCategories.length; i++) {
                        const item = filesWithCategories[i];
                        self.uploadProgress = `Uploading image ${i + 1} of ${filesWithCategories.length}...`;

                        // We yield each call individually so the backend
                        // can finish one transaction before the next starts
                        yield uploadItemImage(newItem.id, item.file, item.category);
                    }

                    const finalItem: ItemDto = yield getItemById(newItem.id);
                    self.myItems.unshift(cast(finalItem));
                    self.selectedItem = finalItem.id as any;
                    return finalItem;
                }
                self.myItems.unshift(cast(newItem));
                self.selectedItem = newItem.id as unknown as Instance<typeof ItemModel>;
                return newItem;
            } catch (err) {
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
            newFilesWithCategories: { file: File, category: ImageCategory }[], // <-- New Signature
            deletedImageIds: string[]
        ) {
            self.isLoading = true;
            self.uploadProgress = "Updating...";
            try {
                const keepImageIds = self.selectedItem?.images
                    .filter(img => !deletedImageIds.includes(img.id))
                    .map(img => img.id) || [];

                yield updateItem(id, { ...data, keepImageIds });

                if (newFilesWithCategories.length > 0) {
                    // SEQUENTIAL UPLOAD FIX:
                    for (const item of newFilesWithCategories) {
                        yield uploadItemImage(id, item.file, item.category);
                    }
                }

                const refreshed: ItemDto = yield getItemById(id);
                updateLocalCache(refreshed);
                return true;
            } catch (err) {
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

                const myItemToRemove = self.myItems.find(i => i.id === id);
                if (myItemToRemove) self.myItems.remove(myItemToRemove);

                if (self.selectedItem?.id === id) self.selectedItem = null;
            } catch (err) {
                self.error = err instanceof Error ? err.message : "Delete failed";
            }
        });

        return {
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