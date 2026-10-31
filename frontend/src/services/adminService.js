import instance from "../api/axios";

export function getAllUsers() {
    return instance.get("/admin/users");
}

export default {
    getAllUsers,
};