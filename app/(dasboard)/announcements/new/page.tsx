'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTeachingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    published: false,
  });

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

    try {
      if (!formData.title.trim()) {
        toast.error('Title is required');
        setIsLoading(false);
        return;
      }

        console.log(formData)

      const { error } = await supabase.from('announcements').insert({
        title: formData.title.trim(),
        content: formData.description,
        published: formData.published,
      });

      if (error) throw error;

      toast.success('Announcement created successfully!');
      router.push('/announcements');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/announcements"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Announcements
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Announcement</h1>
        <p className="text-gray-600 mt-1">Create a new announcements</p>
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

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Announcement
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
            />
          </div>

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
              {isLoading ? 'Creating…' : 'Create Announcement'}
            </button>

            <Link
              href="/announcements"
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
