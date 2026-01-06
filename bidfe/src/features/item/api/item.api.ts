import type { ItemSubmitRequest, ItemDto } from "../types.ts";
import { tokenStorage } from "../../../shared/lib/token.ts";
import {http} from "../../../shared/api/HttpClient.ts";
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
        // 1. Read the body as text first to avoid JSON parsing errors hiding the message
        const errorText = await response.text();
        let errorMessage = "Failed to submit item";

        try {
            // 2. Try to parse it as JSON (Standard Spring Boot Error)
            const errorJson = JSON.parse(errorText);

            // Check standard fields: message, error, or detail
            if (errorJson.message) errorMessage = errorJson.message;
            else if (errorJson.error) errorMessage = errorJson.error;
            else if (errorJson.detail) errorMessage = errorJson.detail;

        } catch {
            // 3. If JSON parse fails, it might be a plain string from the backend
            if (errorText && errorText.trim().length > 0) {
                errorMessage = errorText;
            }
        }

        throw new Error(errorMessage);
    }

    return response.json();
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

/**
 * Fetches only the items belonging to the current authenticated user.
 */
export const getMyItems = () =>
    http<ItemDto[]>("/items/me", { method: "GET" });

/**
 * Updates a specific item.
 */
export const updateItem = (id: string, data: ItemSubmitRequest) =>
    http<ItemDto>(`/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

/**
 * Deletes a specific item.
 */
export const deleteItem = (id: string) =>
    http<void>(`/items/${id}`, { method: "DELETE" });