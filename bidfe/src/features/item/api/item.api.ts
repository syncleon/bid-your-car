import type {
    ItemCreateRequest,
    ItemDto,
    ItemImageDto,
    ItemUpdateRequest,
    Page,
    // Make sure to export/import your new ImageCategory enum in your types file!
    ImageCategory
} from "../types";
import { http } from "../../../shared/api/HttpClient";

export const submitItem = (data: ItemCreateRequest) =>
    http<ItemDto>("/items", {
        method: "POST",
        body: JSON.stringify(data),
    });

/**
 * Uploads an image for an item with a specific category.
 * The backend handles automatically demoting the old MAIN image if a new one is uploaded.
 */
export const uploadItemImage = (
    itemId: string,
    file: File,
    category: ImageCategory | string = "OTHER"
) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    // The browser will automatically set 'Content-Type: multipart/form-data; boundary=...'
    return http<ItemImageDto>(`/items/${itemId}/images`, {
        method: "POST",
        body: formData,
    });
};

// NOTE: getAllItems was removed!
// Public browsing should now be done via AuctionApi.getPublicAuctions()

export const getMyItems = (page = 0, size = 20) =>
    http<Page<ItemDto>>(`/items/me?page=${page}&size=${size}&sort=createdDate,desc`, {
        method: "GET"
    });

export const getItemById = (id: string) =>
    http<ItemDto>(`/items/${id}`, {
        method: "GET"
    });

export const updateItem = (id: string, data: ItemUpdateRequest) =>
    http<ItemDto>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteItem = (id: string) =>
    http<Record<string, string>>(`/items/${id}`, {
        method: "DELETE"
    });