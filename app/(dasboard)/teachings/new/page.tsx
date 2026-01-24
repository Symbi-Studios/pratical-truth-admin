'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewTeachingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('audios')
      .select('category')
      .not('category', 'is', null);

    if (!error && data) {
      const uniqueCategories = Array.from(new Set(data.map(a => a.category)));
      setCategories(uniqueCategories as string[]);
    }
  };

  fetchCategories();
}, []);



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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let categoryToSave = formData.category;
    if (newCategory.trim()) {
      categoryToSave = newCategory.trim();
    }

    try {
      let audioUrl: string | null = null;

      if (!formData.title.trim()) {
        toast.error('Title is required');
        setIsLoading(false);
        return;
      }

      if (!audioFile && !formData.audio_url.trim()) {
        toast.error('Audio file or audio URL is required');
        setIsLoading(false);
        return;
      }

      // 🔹 Upload audio if selected
      if (audioFile) {
        const ext = audioFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `teachings${fileName}`;

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

        audioUrl = data.publicUrl;
      }

      const speakersArray = formData.speakers
        ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean)
        : [];

        console.log(formData)

      const { error } = await supabase.from('audios').insert({
        title: formData.title.trim(),
        description: formData.description,
        audio_url: audioUrl || formData.audio_url,
        category: categoryToSave || null,
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : null,
        event_date: formData.event_date || null,
        speakers: speakersArray,
        published: formData.published,
      });

      if (error) throw error;

      toast.success('Audio created successfully!');
      router.push('/teachings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create audio');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const check = categories.some(cat => cat === newCategory)
    if(check){
      alert('Category already exist')
    }else{
      setCategories([...categories, newCategory])
      setNewCategory('')
    }
    
  }


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
        <h1 className="text-3xl font-bold text-gray-900">Add New Audio</h1>
        <p className="text-gray-600 mt-1">Create a new teaching audio</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
            />
          </div>

          {/* Audio URL + Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Audio URL
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                name="audio_url"
                value={formData.audio_url}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
                placeholder="https://example.com/audio.mp3"
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
                  toast.success('Audio selected');
                }
              }}
            />

            {audioFile && (
              <p className="text-xs text-gray-500 mt-2">
                Selected file: {audioFile.name}
              </p>
            )}
          </div>

          {/* Category & Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>

            <div className="flex gap-2 items-center">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Input for adding a new category */}
              <input
                type="text"
                placeholder="Add new"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl flex-1"
              />
              <div
               onClick={handleAddCategory}
               className='bg-secondary justify-center items-center'>
                <p className='px-4 py-2 text-white'>Add</p>
              </div>
            </div>
          </div>


          {/* Teachings Date and Time */}
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
              required
              className="px-4 py-3 border border-gray-300 rounded-xl"
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
            Publish immediately
          </label>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary text-white py-3 rounded-xl disabled:opacity-50"
            >
              {isLoading ? 'Creating…' : 'Create Audio'}
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
