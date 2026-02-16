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
            const data = await getUserItems();
            setItems(data.content || []);
        } catch (error: unknown) {
            console.error(error);
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