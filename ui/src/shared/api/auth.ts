import { http } from "./http";

export const login = async (username: string, password: string) => {
    const { data } = await http.post("/api/login", {
        name: username,
        password,
    });
    return data;
};
