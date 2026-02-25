import { types, flow, cast, type Instance } from "mobx-state-tree";
import {
    getMyItems,
    getItemById,
    submitItem,
    deleteItem,
    updateItem,
    uploadItemImage
} from "../api/item.api";
import {
    CONDITION_GRADES,
    type ConditionGrade, IMAGE_CATEGORIES,
    type ImageCategory, ITEM_STATUSES,
    type ItemCreateRequest,
    type ItemDto,
    type ItemStatus,
    type ItemUpdateRequest
} from "../types";
import type { UserDto } from "../../auth/types";
import type {AuctionDto} from "../../auction/types.ts";

const ItemStatusEnum = types.enumeration<ItemStatus>("ItemStatus", ITEM_STATUSES);
const ConditionGradeEnum = types.enumeration<ConditionGrade>("ConditionGrade", CONDITION_GRADES);
const ImageCategoryEnum = types.enumeration<ImageCategory>("ImageCategory", IMAGE_CATEGORIES);

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
    fuelType: types.maybeNull(types.string),
    horsepower: types.maybeNull(types.number),
    condition: ConditionGradeEnum,
    titleStatus: types.maybeNull(types.string),
    isModified: types.boolean,
    hasServiceHistory: types.boolean,
    reservePrice: types.maybeNull(types.number),
    isNoReserve: types.boolean,
    engine: types.maybeNull(types.string),
    drivetrain: types.maybeNull(types.string),
    transmission: types.maybeNull(types.string),
    bodyStyle: types.maybeNull(types.string),
    exteriorColor: types.maybeNull(types.string),
    interiorColor: types.maybeNull(types.string),
    sellerType: types.maybeNull(types.string),
    images: types.array(ItemImageModel),
    auctionId: types.maybeNull(types.string),
    auction: types.frozen<AuctionDto>(),
});

export const ItemStore = types
    .model("ItemStore", {
        myItems: types.array(ItemModel),
        selectedItem: types.maybeNull(types.reference(ItemModel)),
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
            if (existingInMyItems !== -1) self.myItems[existingInMyItems] = cast(itemData as any);
        };

        const loadItemDetails = flow(function* (id: string) {
            self.isLoading = true;
            self.error = null;
            try {
                const itemData: ItemDto = yield getItemById(id);
                updateLocalCache(itemData);

                const exists = self.myItems.find(i => i.id === id);
                if (!exists) {
                    self.myItems.push(cast(itemData as any));
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

        const submitNewItem = flow(function* (
            data: ItemCreateRequest,
            filesWithCategories: { file: File, category: ImageCategory }[]
        ) {
            self.isLoading = true;
            self.uploadProgress = "Creating listing...";
            try {
                const newItem: ItemDto = yield submitItem(data);

                if (filesWithCategories.length > 0) {
                    for (let i = 0; i < filesWithCategories.length; i++) {
                        const item = filesWithCategories[i];
                        self.uploadProgress = `Uploading image ${i + 1} of ${filesWithCategories.length}...`;
                        yield uploadItemImage(newItem.id, item.file, item.category);
                    }

                    const finalItem: ItemDto = yield getItemById(newItem.id);
                    self.myItems.unshift(cast(finalItem as any));
                    self.selectedItem = finalItem.id as unknown as Instance<typeof ItemModel>;
                    return finalItem;
                }
                self.myItems.unshift(cast(newItem) as any);
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