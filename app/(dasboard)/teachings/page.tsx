'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Play, Eye, EyeOff } from 'lucide-react';
import { formatDuration } from '@/helper/formatDuration';

export default function TeachingsPage() {
  const router = useRouter();
  const [audios, setAudios] = useState<any[]>([]);
  const [filteredAudios, setFilteredAudios] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAudios();
  }, []);

  useEffect(() => {
    filterAudios();
  }, [searchQuery, filterCategory, filterStatus, audios]);

  const fetchAudios = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudios(data || []);
    } catch (error: any) {
      toast.error('Failed to load audios');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAudios = () => {
    let filtered = [...audios];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (audio) =>
          audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          audio.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          audio.speakers?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((audio) => audio.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (audio) => audio.published === (filterStatus === 'published')
      );
    }

    setFilteredAudios(filtered);
  };

 const handleDelete = async (id: string, title: string) => {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

  try {
    // 1️⃣ Fetch the audio row first to get the file path
    const { data: audioData, error: fetchError } = await supabase
      .from('audios')
      .select('audio_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const audioUrl = audioData?.audio_url;

    // 2️⃣ Delete from storage if there is a file
    if (audioUrl) {
      // Supabase returns a public URL like:
      // https://xyz.supabase.co/storage/v1/object/public/audio-files/teachings/file.mp3
      // We need the path relative to the bucket
      const url = new URL(audioUrl);
      // remove '/object/audio-files/' prefix if needed
      const pathIndex = url.pathname.indexOf('/audio-files/');
      const filePath = pathIndex !== -1 ? url.pathname.slice(pathIndex + 13) : null;

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('audio-files')
          .remove([filePath]);

        if (storageError) throw storageError;
      }
    }

    // 3️⃣ Delete the row from the database
    const { error } = await supabase.from('audios').delete().eq('id', id);
    if (error) throw error;

    toast.success('Audio deleted successfully');
    await fetchAudios();
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete audio');
    console.error(error);
  }
};


  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('audios')
        .update({ published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Audio ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchAudios();
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const categories = Array.from(new Set(audios.map((a) => a.category).filter(Boolean)));

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
          <h1 className="text-3xl font-bold text-gray-900">Teachings (Audios)</h1>
          <p className="text-gray-600 mt-1">{audios.length} total audios</p>
        </div>
        <Link
          href="/teachings/new"
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Add New Audio
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search audios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
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

      {/* Audios List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filteredAudios.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAudios.map((audio) => (
              <div
                key={audio.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {audio.title}
                      </h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          audio.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {audio.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {audio.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {audio.category && (
                        <span className="flex items-center gap-1">
                          📁 {audio.category}
                        </span>
                      )}
                      {audio.duration_seconds && (
                        <span className="flex items-center gap-1">
                          ⏱️ {formatDuration(audio.duration_seconds)}
                        </span>
                      )}
                      {audio.event_date && (
                        <span className="flex items-center gap-1">
                          📅 {new Date(audio.event_date).toLocaleDateString()}
                        </span>
                      )}
                      {audio.speakers && audio.speakers.length > 0 && (
                        <span className="flex items-center gap-1">
                          🎤 {audio.speakers.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {audio.audio_url && (
                      <button
                        onClick={() => window.open(audio.audio_url, '_blank')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Play audio"
                      >
                        <Play className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <button
                      onClick={() => togglePublished(audio.id, audio.published)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title={audio.published ? 'Unpublish' : 'Publish'}
                    >
                      {audio.published ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <Link
                      href={`/teachings/edit/${audio.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(audio.id, audio.title)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No audios found</p>
            <Link
              href="/teachings/new"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add your first audio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}