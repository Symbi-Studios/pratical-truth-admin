'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [globalTotalCount, setGlobalTotalCount] = useState(0); // Added state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input by 400ms so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch whenever page or debounced query changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Server-side search — only add filter if there's a query
      if (debouncedQuery.trim()) {
        query = query.or(
          `name.ilike.%${debouncedQuery.trim()}%,email.ilike.%${debouncedQuery.trim()}%`
        );
      }

      const { data, count, error } = await query;

      if (error) throw error;
      setUsers(data || []);
      setTotalCount(count || 0);

      // Only update the global total when not searching
      if (!debouncedQuery.trim()) {
        setGlobalTotalCount(count || 0);
      }
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startEntry = (currentPage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          {/* Replaced totalCount with globalTotalCount */}
          <p className="text-gray-600 mt-1">{globalTotalCount} total users</p>
        </div>
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Users className="w-7 h-7 text-primary" />
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-6">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Registered Users</p>
          {/* Replaced totalCount with globalTotalCount */}
          <h2 className="text-4xl font-bold text-gray-900">{globalTotalCount}</h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          {/* Show subtle indicator when debounce is pending */}
          {searchQuery !== debouncedQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              searching...
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-6 h-4 bg-gray-100 rounded" />
                <div className="w-9 h-9 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-1/5" />
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {startEntry + index}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {(user.name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {user.name || (
                              <span className="text-gray-400 italic">No name</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">
                    {startEntry}–{endEntry}
                  </span>{' '}
                  of{' '}
                  {/* Keep totalCount here for pagination accuracy */}
                  <span className="font-semibold text-gray-700">{totalCount}</span> users
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>

                  {getPageNumbers().map((page, i) =>
                    page === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-3 py-1 text-gray-400 text-sm">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {debouncedQuery ? 'No users match your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}