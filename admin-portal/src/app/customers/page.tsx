"use client";

import React, { useEffect, useState } from "react";
import { Users as UsersIcon, Search, MoreVertical, ShieldAlert, CheckCircle2, Lock, Unlock, Mail, Shield, UserCheck, UserX, Loader2, ChevronRight } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  loginAttempts: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get("/users");
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/users/${id}`, { action: currentStatus ? "unblock" : "block" });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBlocked: !currentStatus } : u))
      );
      toast.success(`User ${currentStatus ? "unblocked" : "blocked"} successfully`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><Shield size={12} /> Admin</span>;
      case "guide":
        return <span className="bg-[#FF8C00]/10 text-[#FF8C00] px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Guide</span>;
      default:
        return <span className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Traveler</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[#FF8C00]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
            User Directory
            <span className="bg-[#FF8C00]/10 text-[#FF8C00] text-sm font-bold px-3 py-1 rounded-full">
              {users.length} Total
            </span>
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            Manage travelers, guides, and admin accounts across the platform.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF8C00] transition-colors"
            size={18}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white dark:bg-[#161B26] border border-gray-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-[#FF8C00] dark:focus:border-[#FF8C00] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users Data View */}
      {/* Mobile Card View (< md) */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#161B26] rounded-3xl border border-gray-100 dark:border-white/5">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto">
              <UsersIcon className="text-gray-300 dark:text-gray-600" size={24} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No users found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={`mobile-${user._id}`} className="p-5 flex flex-col gap-4 bg-white dark:bg-[#161B26] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C00]/20 to-[#FF8C00]/5 border border-[#FF8C00]/20 flex items-center justify-center text-[#FF8C00] font-black text-sm shadow-sm flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{user.name}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
                        <Mail size={12} className="flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>
                  {getRoleBadge(user.role)}
                </div>
                
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Status</span>
                    {user.isBlocked ? (
                      <span className="flex items-center gap-1 font-bold text-red-500"><Lock size={12} /> Blocked</span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-blue-500"><Unlock size={12} /> Active</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Joined</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                  {user.role !== "admin" && (
                    <button
                      onClick={() => toggleBlockStatus(user._id, user.isBlocked)}
                      className={`flex-1 py-2 rounded-xl border transition-all text-xs font-bold flex items-center justify-center gap-2 ${
                        user.isBlocked 
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600" 
                          : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600"
                      }`}
                    >
                      {user.isBlocked ? <><Unlock size={14} /> Unblock</> : <><Lock size={14} /> Block</>}
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] hover:border-[#FF8C00]/20 transition-all text-xs font-bold flex items-center justify-center gap-1"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      {/* Users Data View */}
      <div className="hidden md:block bg-white dark:bg-[#161B26] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-200/40 dark:shadow-none overflow-hidden">
        {/* Desktop/Tablet Table View (>= md) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-responsive min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Security</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <UsersIcon className="text-gray-300 dark:text-gray-600" size={24} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No users found matching "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5" data-label="User Profile">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8C00]/20 to-[#FF8C00]/5 border border-[#FF8C00]/20 flex items-center justify-center text-[#FF8C00] font-black text-lg shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5" data-label="Role">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-5" data-label="Security">
                      <div className="flex flex-col gap-1.5">
                        {user.isEmailVerified ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={14} /> Verified Email
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                            <ShieldAlert size={14} /> Unverified
                          </span>
                        )}
                        {user.isBlocked ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                            <Lock size={14} /> Login Blocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                            <Unlock size={14} /> Login Allowed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5" data-label="Joined">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => toggleBlockStatus(user._id, user.isBlocked)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              user.isBlocked 
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white" 
                                : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 hover:bg-red-500 hover:text-white"
                            }`}
                            title={user.isBlocked ? "Unblock User" : "Block User"}
                          >
                            {user.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:bg-[#FF8C00]/10 hover:text-[#FF8C00] hover:border-[#FF8C00]/20 transition-all"
                          title="View User Details"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/10 flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF8C00]/20 to-[#FF8C00]/5 border border-[#FF8C00]/20 flex items-center justify-center text-[#FF8C00] font-black text-2xl shadow-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedUser.name}
                  </h2>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                    {selectedUser.role} Account
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                <span className="font-bold text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Account Information</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 dark:bg-[#161B26] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Email Address</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.email}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#161B26] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Email Verification</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.isEmailVerified ? "Verified" : "Unverified"}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#161B26] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Joined Date</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Security & Access</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 dark:bg-[#161B26] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Account Status</span>
                    <span className={`text-sm font-bold ${selectedUser.isBlocked ? "text-red-500" : "text-emerald-500"}`}>
                      {selectedUser.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#161B26] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Failed Login Attempts</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.loginAttempts || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
