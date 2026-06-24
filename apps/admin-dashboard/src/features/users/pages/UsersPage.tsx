import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/features/users/api/users.api";
import { teamApi } from "@/features/users/api/team.api";
import { queryKeys } from "@/lib/Querykeys";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/types";
import { useAuthStore } from "@/store/auth.store";

const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["MANAGER", "SALES_AGENT"]),
});

const editUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    role: z.enum(["MANAGER", "SALES_AGENT"]).optional(),
    active: z.boolean().optional(),
});

const editTeamMemberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    active: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;
type EditTeamMemberFormValues = z.infer<typeof editTeamMemberSchema>;

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function UsersPage() {
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);
    const isAdmin = tenant?.role === "ADMIN";

    const { data: users = [], isLoading, error } = useQuery({
        queryKey: [...queryKeys.users],
        queryFn: isAdmin ? usersApi.getAll : teamApi.getMembers,
        enabled: !!tenant?.role,
    });

    const [maxUsersInput, setMaxUsersInput] = useState(tenant?.max_users ?? 99);
    const maxUsersMutation = useMutation({
        mutationFn: (max_users: number) => usersApi.updateSettings(max_users),
        onSuccess: (data) => {
            toast.success("User limit updated successfully");
            useAuthStore.getState().setSession({ ...tenant!, max_users: data.max_users });
            setMaxUsersInput(data.max_users);
        },
        onError: (err: Error) => {
            toast.error(err?.message || "Failed to update limit");
        },
    });

    const createForm = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { name: "", email: "", password: "", role: "SALES_AGENT" },
    });

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const editForm = useForm<EditUserFormValues>({
        resolver: zodResolver(editUserSchema),
    });

    const teamEditForm = useForm<EditTeamMemberFormValues>({
        resolver: zodResolver(editTeamMemberSchema),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: [...queryKeys.users] });

    const createMutation = useMutation({
        mutationFn: (data: CreateUserPayload) => usersApi.create(data),
        onSuccess: () => {
            toast.success("User created successfully");
            createForm.reset();
            setShowCreate(false);
            invalidate();
        },
        onError: (err: Error) => {
            toast.error(err?.message || "Failed to create user");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
            usersApi.update(id, payload),
        onSuccess: () => {
            toast.success("User updated successfully");
            setEditingUser(null);
            editForm.reset();
            invalidate();
        },
        onError: (err: Error) => {
            toast.error(err?.message || "Failed to update user");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => usersApi.remove(id),
        onSuccess: () => {
            toast.success("User deleted successfully");
            invalidate();
        },
        onError: (err: Error) => {
            toast.error(err?.message || "Failed to delete user");
        },
    });

    const updateTeamMemberMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: EditTeamMemberFormValues }) =>
            teamApi.updateMember(id, payload),
        onSuccess: () => {
            toast.success("Team member updated successfully");
            setEditingUser(null);
            teamEditForm.reset();
            invalidate();
        },
        onError: (err: Error) => {
            toast.error(err?.message || "Failed to update team member");
        },
    });

    const openEdit = (user: User) => {
        setEditingUser(user);
        if (isAdmin) {
            editForm.reset({
                name: user.name,
                email: user.email,
                role: user.role as "MANAGER" | "SALES_AGENT",
                active: user.active,
            });
        } else {
            teamEditForm.reset({
                name: user.name,
                email: user.email,
                active: user.active,
            });
        }
    };

    const closeEdit = () => {
        setEditingUser(null);
        editForm.reset();
        teamEditForm.reset();
    };

    const columns = [
        { key: "name" as const, label: "Name" },
        { key: "email" as const, label: "Email" },
        { key: "role" as const, label: "Role" },
        { key: "active" as const, label: "Status" },
        { key: "created_at" as const, label: "Created" },
    ];

    return (
        <Layout>
            <PageHeader
                title={isAdmin ? "Users" : "My Team"}
                description={isAdmin ? "Manage team members and their roles" : "View and manage your team members"}
                action={isAdmin && !showCreate ? () => setShowCreate(true) : undefined}
                actionLabel={isAdmin ? "+ Add User" : undefined}
            />

            {showCreate && isAdmin && (
                <Card className="mb-6">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-800">New User</h3>
                        <p className="mb-6 text-sm text-slate-500">Add a new team member under your dealership.</p>

                        <form
                            onSubmit={createForm.handleSubmit((data) =>
                                createMutation.mutate(data as CreateUserPayload)
                            )}
                            className="flex flex-col gap-4"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-slate-700">Name</label>
                                    <input
                                        {...createForm.register("name")}
                                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                    <FieldError message={createForm.formState.errors.name?.message} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        {...createForm.register("email")}
                                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                    <FieldError message={createForm.formState.errors.email?.message} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-slate-700">Password</label>
                                    <input
                                        type="password"
                                        {...createForm.register("password")}
                                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                    />
                                    <FieldError message={createForm.formState.errors.password?.message} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold text-slate-700">Role</label>
                                    <select
                                        {...createForm.register("role")}
                                        className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                    >
                                        <option value="SALES_AGENT">Sales Agent</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                    <FieldError message={createForm.formState.errors.role?.message} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreate(false); createForm.reset(); }}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </Card>
            )}

            {isAdmin && (
                <Card className="mb-6">
                    <div className="flex items-center justify-between p-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700">User Limit</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {users.length} / {tenant?.max_users ?? 99} active users
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={1}
                                max={999}
                                value={maxUsersInput}
                                onChange={(e) => setMaxUsersInput(Number(e.target.value))}
                                className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm text-center outline-none transition focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => maxUsersMutation.mutate(maxUsersInput)}
                                disabled={maxUsersMutation.isPending || maxUsersInput === tenant?.max_users}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {maxUsersMutation.isPending ? "Saving..." : "Set Limit"}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {isLoading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : error ? (
                <Card>
                    <div className="p-6 text-center text-red-600">
                        Failed to load users. Please try again.
                    </div>
                </Card>
            ) : (
                <DataTable
                    columns={columns}
                    data={users}
                    onEdit={isAdmin ? openEdit : openEdit}
                    onDelete={isAdmin ? (user) => deleteMutation.mutate(user.id) : undefined}
                />
            )}

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        {isAdmin ? (
                            <>
                                <h3 className="text-lg font-semibold text-slate-800">Edit User</h3>
                                <p className="mb-6 text-sm text-slate-500">Update user information and settings.</p>

                                <form
                                    onSubmit={editForm.handleSubmit((data) =>
                                        updateMutation.mutate({ id: editingUser.id, payload: data })
                                    )}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">Name</label>
                                        <input
                                            {...editForm.register("name")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={editForm.formState.errors.name?.message} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            {...editForm.register("email")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={editForm.formState.errors.email?.message} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">New Password (leave empty to keep current)</label>
                                        <input
                                            type="password"
                                            {...editForm.register("password")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={editForm.formState.errors.password?.message} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">Role</label>
                                        <select
                                            {...editForm.register("role")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        >
                                            <option value="SALES_AGENT">Sales Agent</option>
                                            <option value="MANAGER">Manager</option>
                                        </select>
                                        <FieldError message={editForm.formState.errors.role?.message} />
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            {...editForm.register("active")}
                                            className="h-4 w-4"
                                        />
                                        Active
                                    </label>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeEdit}
                                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updateMutation.isPending}
                                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                        >
                                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold text-slate-800">Edit Team Member</h3>
                                <p className="mb-6 text-sm text-slate-500">Update team member information.</p>

                                <form
                                    onSubmit={teamEditForm.handleSubmit((data) =>
                                        updateTeamMemberMutation.mutate({ id: editingUser.id, payload: data })
                                    )}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">Name</label>
                                        <input
                                            {...teamEditForm.register("name")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={teamEditForm.formState.errors.name?.message} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            {...teamEditForm.register("email")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={teamEditForm.formState.errors.email?.message} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-slate-700">New Password (leave empty to keep current)</label>
                                        <input
                                            type="password"
                                            {...teamEditForm.register("password")}
                                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                        />
                                        <FieldError message={teamEditForm.formState.errors.password?.message} />
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            {...teamEditForm.register("active")}
                                            className="h-4 w-4"
                                        />
                                        Active
                                    </label>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeEdit}
                                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updateTeamMemberMutation.isPending}
                                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                        >
                                            {updateTeamMemberMutation.isPending ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}
