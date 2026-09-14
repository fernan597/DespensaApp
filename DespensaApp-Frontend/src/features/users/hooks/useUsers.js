import { useState, useEffect, useCallback } from "react";
import { fetchUsers, deleteUser } from "../../../services/userService";

/**
 * Custom Hook para gestionar usuarios, filtros y operaciones CRUD.
 */
export function useUsers() {
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage(null);
        }, 4000);
    };

    const loadUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setFetchError(null);
        try {
            const data = await fetchUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error al cargar usuarios:", err);
            setFetchError("No se pudieron cargar los usuarios del servidor.");
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const addUser = (newUser) => {
        setUsers((prev) => [newUser, ...prev]);
        showToast(`Usuario "${newUser.name}" registrado correctamente.`);
    };

    const removeUser = async (id) => {
        const previousUsers = users;
        setUsers((prev) => prev.filter((u) => u.id !== id));
        try {
            const response = await deleteUser(id);
            showToast(`Usuario "${response?.user?.name || "eliminado"}" eliminado correctamente.`);
            return true;
        } catch (error) {
            setUsers(previousUsers);
            alert(error.message || "Error al eliminar el usuario.");
            return false;
        }
    };

    // Usuarios filtrados
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole =
            roleFilter === "" ||
            u.role === roleFilter ||
            (roleFilter === "admin_despensa" && (u.role === "admin_despensa")) ||
            (roleFilter === "empleado" && (u.role === "empleado" || u.role === "cajero")) ||
            (roleFilter === "admin" && (u.role === "admin" || u.role === "administrador"));

        const userStatus = u.status || "active";
        const matchesStatus = statusFilter === "" || userStatus === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return {
        users,
        filteredUsers,
        isLoadingUsers,
        fetchError,
        toastMessage,
        setToastMessage,
        searchTerm,
        setSearchTerm,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        loadUsers,
        addUser,
        removeUser,
        showToast,
    };
}
