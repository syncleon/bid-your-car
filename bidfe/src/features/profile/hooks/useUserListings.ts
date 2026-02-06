import { useState, useEffect, useCallback } from "react";
import type { ItemDto } from "../../item/types";
import { getUserItems } from "../api/profile.api";

export const useUserListings = () => {
    const [items, setItems] = useState<ItemDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // data is now typed as Page<ItemDto>
            const data = await getUserItems();

            // FIX: Extract the array from the 'content' property
            // We also add a fallback to [] just in case data.content is undefined
            setItems(data.content || []);

        } catch (err: any) {
            console.error(err);
            setError("Could not load your listings.");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return { items, isLoading, error, refresh: fetchItems };
};