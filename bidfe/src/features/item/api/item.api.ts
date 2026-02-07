import type {ItemCreateRequest, ItemDto, ItemImageDto, ItemUpdateRequest, Page} from "../types";
import { tokenStorage } from "../../../shared/lib/token";
import { http } from "../../../shared/api/HttpClient";

const BASE_URL = "http://localhost:8080/api/v1/items";

// Helper to handle the specific error format from your backend
const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
            const body = await response.json();
            // Match GlobalExceptionHandler structure
            if (body.error) errorMessage = body.error;
            else if (body.details) errorMessage = Object.values(body.details).join(", ");
            else if (body.message) errorMessage = body.message;
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const submitItem = async (data: ItemCreateRequest): Promise<ItemDto> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("No authentication token found.");

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });

    return handleResponse<ItemDto>(response);
};

export const uploadItemImage = async (itemId: string, file: File): Promise<ItemImageDto> => {
    const token = tokenStorage.get();
    if (!token) throw new Error("No authentication token found.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/${itemId}/images`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
    });

    return handleResponse<ItemImageDto>(response);
};

export const deleteImage = (imageId: string) =>
    http<void>(`/items/images/${imageId}`, { method: "DELETE" });

// ✅ UPDATED: Now supports pagination
export const getAllItems = async (page = 0, size = 20): Promise<Page<ItemDto>> => {
    const response = await fetch(`${BASE_URL}?page=${page}&size=${size}&sort=createdDate,desc`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleResponse<Page<ItemDto>>(response);
};

// ✅ UPDATED: Now supports pagination
export const getMyItems = async (page = 0, size = 20): Promise<Page<ItemDto>> => {
    const token = tokenStorage.get();
    const response = await fetch(`${BASE_URL}/me?page=${page}&size=${size}&sort=createdDate,desc`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return handleResponse<Page<ItemDto>>(response);
};

export const getItemById = (id: string) =>
    http<ItemDto>(`/items/${id}`, { method: "GET" });

export const updateItem = (id: string, data: ItemUpdateRequest) =>
    http<ItemDto>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
export const deleteItem = (id: string) =>
    http<void>(`/items/${id}`, { method: "DELETE" });
