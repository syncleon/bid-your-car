import type {
    ItemCreateRequest,
    ItemDto,
    ItemImageDto,
    ItemUpdateRequest,
    Page,
    ImageCategory
} from "../types";
import { http } from "../../../shared/api/HttpClient";

export const submitItem = (data: ItemCreateRequest) =>
    http<ItemDto>("/items", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const uploadItemImage = (
    itemId: string,
    file: File,
    category: ImageCategory | string = "OTHER"
) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    return http<ItemImageDto>(`/items/${itemId}/images`, {
        method: "POST",
        body: formData,
    });
};

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