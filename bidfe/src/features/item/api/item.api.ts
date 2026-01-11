import type { ItemSubmitRequest, ItemDto } from "../types.ts";
import { tokenStorage } from "../../../shared/lib/token.ts";
import { http } from "../../../shared/api/HttpClient.ts";

// Ensure this matches your backend URL structure
const BASE_URL = "http://localhost:8080/api/v1/items";

export const submitItem = async (data: ItemSubmitRequest): Promise<ItemDto> => {
    const token = tokenStorage.get();

    if (!token) {
        throw new Error("No authentication token found. Please log in.");
    }

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to submit item";

        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) errorMessage = errorJson.message;
            else if (errorJson.error) errorMessage = errorJson.error;
            else if (errorJson.detail) errorMessage = errorJson.detail;
        } catch {
            if (errorText && errorText.trim().length > 0) {
                errorMessage = errorText;
            }
        }

        throw new Error(errorMessage);
    }

    return response.json();
};

/**
 * ✅ NEW: Uploads a single image for a specific item.
 * Note: We do NOT set 'Content-Type' header here.
 * The browser automatically sets it to 'multipart/form-data' with the correct boundary.
 */
export const uploadItemImage = async (itemId: string, file: File): Promise<void> => {
    const token = tokenStorage.get();

    if (!token) {
        throw new Error("No authentication token found.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/${itemId}/images`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to upload image: ${file.name}`);
    }
};

export const getAllItems = async (): Promise<ItemDto[]> => {
    const response = await fetch(BASE_URL, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Failed to load auctions");
    }

    return response.json();
};

export const getMyItems = () =>
    http<ItemDto[]>("/items/me", { method: "GET" });

export const updateItem = (id: string, data: ItemSubmitRequest) =>
    http<ItemDto>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteItem = (id: string) =>
    http<void>(`/items/${id}`, { method: "DELETE" });