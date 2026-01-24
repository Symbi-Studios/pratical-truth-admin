'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function EditTeachingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audio_url: '',
    category: '',
    duration_minutes: '',
    event_date: '',
    speakers: '',
    published: false,
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  /* -------------------------------- Fetch teaching -------------------------------- */

  useEffect(() => {
    if (id) fetchTeaching();
    fetchCategories();
  }, [id]);

  const fetchTeaching = async () => {
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || '',
        description: data.description || '',
        audio_url: data.audio_url || '',
        category: data.category || '',
        duration_minutes: data.duration_minutes?.toString() || '',
        event_date: data.event_date || '',
        speakers: data.speakers?.join(', ') || '',
        published: data.published || false,
      });
    } catch (error: any) {
      toast.error('Failed to load teaching');
      console.error(error);
      router.push('/teachings');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('audios')
      .select('category')
      .not('category', 'is', null);

    if (data) {
      const unique = Array.from(new Set(data.map(a => a.category)));
      setCategories(unique as string[]);
    }
  };

  /* -------------------------------- Handlers -------------------------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    const check = categories.some(cat => cat === newCategory.trim());
    if (check) {
      alert('Category already exists');
    } else {
      setCategories([...categories, newCategory.trim()]);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
    }
  };

  /* -------------------------------- Submit -------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let finalAudioUrl = formData.audio_url;
    let categoryToSave = newCategory.trim() || formData.category || null;

    try {
      if (!formData.title.trim()) {
        toast.error('Title is required');
        setIsLoading(false);
        return;
      }

      // Upload new audio if selected
      if (audioFile) {
        const ext = audioFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `teachings/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(filePath, audioFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('audio-files')
          .getPublicUrl(filePath);

        finalAudioUrl = data.publicUrl;
      }

      const speakersArray = formData.speakers
        ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from('audios')
        .update({
          title: formData.title.trim(),
          description: formData.description,
          audio_url: finalAudioUrl,
          category: categoryToSave,
          duration_minutes: formData.duration_minutes
            ? parseInt(formData.duration_minutes)
            : null,
          event_date: formData.event_date || null,
          speakers: speakersArray,
          published: formData.published,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Audio updated successfully!');
      router.push('/teachings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update audio');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------- Loading -------------------------------- */

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  /* -------------------------------- UI -------------------------------- */

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teachings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Teachings</h1>
        <p className="text-gray-600 mt-1">Update teaching content</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-6">

          {/* Title */}
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            placeholder="Title"
            required
          />

          {/* Description */}
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
            placeholder="Description"
          />

          {/* Audio */}
          <div>
            <div className="flex gap-2">
              <input
                type="url"
                name="audio_url"
                value={formData.audio_url}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setAudioFile(e.target.files[0]);
                  toast.success('New audio selected');
                }
              }}
            />

            {audioFile && (
              <p className="text-xs text-gray-500 mt-2">
                New file: {audioFile.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="flex gap-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Add new"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl flex-1"
            />

            <div
              onClick={handleAddCategory}
              className="bg-secondary flex items-center justify-center cursor-pointer rounded-xl"
            >
              <p className="px-4 py-2 text-white">Add</p>
            </div>
          </div>

          {/* Event date */}
          <input
            type="date"
            name="event_date"
            value={formData.event_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
          />

          <input
            type="time"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
          />

          {/* Speakers */}
          <input
            type="text"
            name="speakers"
            value={formData.speakers}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            placeholder="Comma-separated speakers"
          />

          {/* Published */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleChange}
            />
            Published
          </label>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary text-white py-3 rounded-xl disabled:opacity-50"
            >
              {isLoading ? 'Updating…' : 'Update Audio'}
            </button>

            <Link
              href="/teachings"
              className="px-6 py-3 border border-gray-300 rounded-xl"
            >
              Cancel
            </Link>
          </div>

        </div>
      </form>
    </div>
  );
}
