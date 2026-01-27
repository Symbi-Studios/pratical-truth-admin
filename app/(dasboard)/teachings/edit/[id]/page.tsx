'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Upload, FileAudio } from 'lucide-react';
import Link from 'next/link';

// Helper to convert seconds (e.g. 300) to "05:00"
const formatSecondsToMMSS = (seconds: number) => {
  if (!seconds && seconds !== 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function EditTeachingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // State for the specific red error text below the input
  const [durationError, setDurationError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audio_url: '',
    category: '',
    duration: '', // Stores string "mm:ss"
    event_date: '',
    speakers: '',
    published: false,
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  /* -------------------------------- Fetch Data -------------------------------- */

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
        // Convert the database seconds back to mm:ss string for the input
        duration: formatSecondsToMMSS(data.duration_seconds),
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
      const unique = Array.from(new Set(data.map((a) => a.category)));
      setCategories(unique as string[]);
    }
  };

  /* -------------------------------- Handlers -------------------------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Specific handler for Duration to manage masking and error state
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9:]/g, '');

    // Auto insert colon after 2 digits if user is typing
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }

    // Limit length to 5 chars (mm:ss)
    if (value.length > 5) return;

    setFormData((prev) => ({ ...prev, duration: value }));

    // Real-time validation
    const regex = /^(\d+):([0-5]\d)$/;
    if (value === '') {
      setDurationError('');
    } else if (!regex.test(value)) {
      setDurationError('Format must be mm:ss (e.g. 05:30)');
    } else {
      setDurationError('');
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    const check = categories.some((cat) => cat === newCategory.trim());
    if (check) {
      toast.error('Category already exists');
    } else {
      setCategories([...categories, newCategory.trim()]);
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
    }
  };

  const getStoragePathFromUrl = (url: string) => {
    try {
      const parts = url.split('/storage/v1/object/public/audio-files/');
      return parts[1] || null;
    } catch {
      return null;
    }
  };

  /* -------------------------------- Submit -------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Block submit if visual error exists
    if (durationError) {
      toast.error('Please fix the duration format');
      return;
    }

    setIsLoading(true);

    let finalAudioUrl = formData.audio_url;
    let categoryToSave = newCategory.trim() || formData.category || null;

    try {
      if (!formData.title.trim()) {
        toast.error('Title is required');
        setIsLoading(false);
        return;
      }

      // 2. Duration Logic: Convert String to Seconds
      let durationSeconds: number | null = null;

      if (formData.duration) {
        const regex = /^(\d+):([0-5]\d)$/;
        const match = formData.duration.match(regex);

        if (!match) {
          toast.error('Invalid Duration! Use mm:ss format (e.g. 05:30)');
          setIsLoading(false);
          return;
        }

        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        durationSeconds = minutes * 60 + seconds;
      } else {
        toast.error('Duration is required');
        setIsLoading(false);
        return;
      }

      // 3. Audio File Upload
      if (audioFile) {
        // Delete old audio first if it exists
        if (formData.audio_url) {
          const oldPath = getStoragePathFromUrl(formData.audio_url);
          if (oldPath) {
            await supabase.storage.from('audio-files').remove([oldPath]);
          }
        }

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

        const { data } = supabase.storage.from('audio-files').getPublicUrl(filePath);
        finalAudioUrl = data.publicUrl;
      }

      // 4. Update Database
      const speakersArray = formData.speakers
        ? formData.speakers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from('audios')
        .update({
          title: formData.title.trim(),
          description: formData.description,
          audio_url: finalAudioUrl,
          category: categoryToSave,
          duration_seconds: durationSeconds,
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

  /* -------------------------------- UI Render -------------------------------- */

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/teachings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teachings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Teaching</h1>
        <p className="text-gray-600 mt-1">Update teaching content and details</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Walking in Spirit"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter a brief description..."
            />
          </div>

          {/* Audio File Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  name="audio_url"
                  value={formData.audio_url}
                  readOnly
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                />
                <FileAudio className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center gap-2 transition-colors"
              >
                <Upload className="w-5 h-5" />
                {audioFile ? 'Change File' : 'Replace Audio'}
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
                  toast.success('New audio file selected');
                }
              }}
            />

            {audioFile && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                New file selected: {audioFile.name}
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-secondary focus:border- outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="New Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl flex-1 outline-none"
              />

              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-secondary hover:bg-blue-700 text-white px-6 rounded-xl font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none"
              />
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-gray-400 font-normal">(mm:ss)</span>
              </label>
              <input
                type="text"
                name="duration"
                placeholder="05:30"
                value={formData.duration}
                required
                onChange={handleDurationChange}
                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${
                  durationError
                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-200'
                    : 'border-gray-300'
                }`}
              />
              {durationError && (
                <p className="text-red-500 text-xs mt-1.5 font-medium animate-pulse">
                  {durationError}
                </p>
              )}
            </div>
          </div>

          {/* Speakers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speakers</label>
            <input
              type="text"
              name="speakers"
              value={formData.speakers}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none"
              placeholder="e.g. John Doe, Jane Smith"
            />
          </div>

          {/* Published Toggle */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="font-medium text-gray-700">Published and visible to users</span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/70 text-white font-medium py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? 'Saving Changes...' : 'Update Teaching'}
            </button>

            <Link
              href="/teachings"
              className="px-8 py-3.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}