'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, filterType, filterStatus, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((event) => event.event_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (event) => event.published === (filterStatus === 'published')
      );
    }

    setFilteredEvents(filtered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to delete event');
      console.error(error);
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Event ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">{events.length} total events</p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="live">Live Events</option>
            <option value="audio">Audio Events</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {event.image_url && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-primary text-overlay rounded-full text-xs font-bold">
                      {event.event_type}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        event.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    ⏰ {event.time}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      📍 {event.location}
                    </div>
                  )}
                </div>

                {event.about && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {event.about}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => togglePublished(event.id, event.published)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title={event.published ? 'Unpublish' : 'Publish'}
                  >
                    {event.published ? (
                      <EyeOff className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <Link
                    href={`/events/${event.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">No events found</p>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add your first event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}