import { http } from "../../../shared/api/HttpClient";
import type { UserDto } from "../../auth/types";
import type { AuctionDto } from "../../auction/types";


export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const adminApi = {
    
    getUsers: (page = 0, size = 20) => {
        return http<PageResponse<UserDto>>(`/users?page=${page}&size=${size}`);
    },
    searchUsers: (query: string, page = 0, size = 20) => {
        return http<PageResponse<UserDto>>(`/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
    },
    deactivateUser: (userId: number) => {
        return http<{ message: string }>(`/users/${userId}`, { method: "DELETE" });
    },

    
    getAuctions: (status?: string, page = 0, size = 20) => {
        const statusParam = status ? `&status=${status}` : '';
        return http<PageResponse<AuctionDto>>(`/auctions?page=${page}&size=${size}${statusParam}&sort=createdDate,desc`);
    },
    approveAuction: (auctionId: string) => {
        return http<{ message: string }>(`/auctions/${auctionId}/approve`, { method: "PATCH" });
    },
    forceCancelAuction: (auctionId: string) => {
        return http<{ message: string }>(`/auctions/admin/${auctionId}/cancel`, { method: "DELETE" });
    }
};
