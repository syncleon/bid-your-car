import type {ItemCreateRequest, ItemDto, ItemImageDto, ItemUpdateRequest, Page} from "../types";
import { tokenStorage } from "../../../shared/lib/token";
import { http } from "../../../shared/api/HttpClient";

const BASE_URL = "https://green-mangos-crash.loca.lt/api/v1/items";

// Helper to handle the specific error format from your backend
const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        // ... старый код обработки ошибок ...
        let errorMessage = `Request failed: ${response.status}`;
        try {
            const body = await response.json();
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
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Bypass-Tunnel-Reminder": "true" // <--- ДОБАВЛЕНО
        },
        body: JSON.stringify(data),
    });
    return handleResponse<ItemDto>(response);
};

export const uploadItemImage = async (itemId: string, file: File): Promise<ItemImageDto> => {
    const token = tokenStorage.get();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/${itemId}/images`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Bypass-Tunnel-Reminder": "true" // <--- ДОБАВЛЕНО
        },
        body: formData,
    });
    return handleResponse<ItemImageDto>(response);
};

export const getAllItems = async (page = 0, size = 20): Promise<Page<ItemDto>> => {
    const response = await fetch(`${BASE_URL}?page=${page}&size=${size}&sort=createdDate,desc`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true" // <--- ДОБАВЛЕНО
        }
    });
    return handleResponse<Page<ItemDto>>(response);
};

export const getMyItems = async (page = 0, size = 20): Promise<Page<ItemDto>> => {
    const token = tokenStorage.get();
    const response = await fetch(`${BASE_URL}/me?page=${page}&size=${size}&sort=createdDate,desc`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Bypass-Tunnel-Reminder": "true" // <--- ДОБАВЛЕНО
        }
    });
    return handleResponse<Page<ItemDto>>(response);
};

export const deleteImage = (imageId: string) =>
    http<void>(`/items/images/${imageId}`, { method: "DELETE" });

export const getItemById = (id: string) =>
    http<ItemDto>(`/items/${id}`, { method: "GET" });

export const updateItem = (id: string, data: ItemUpdateRequest) =>
    http<ItemDto>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
export const deleteItem = (id: string) =>
    http<void>(`/items/${id}`, { method: "DELETE" });
