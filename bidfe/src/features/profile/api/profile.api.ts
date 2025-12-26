import type { Profile } from "../types";
import {http} from "../../../shared/api/HttpClient.ts";

export const getProfile = () => {
    return http<Profile>("http://localhost:8080/api/v1/profile");
};