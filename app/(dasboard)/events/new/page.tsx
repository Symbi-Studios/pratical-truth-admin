'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    event_type: 'live',
    date: '',
    time: '',
    location: '',
    about: '',
    registration_url: '',
    published: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
  };

  /* ---------------- IMAGE UPLOAD LOGIC ---------------- */
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const ext = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `events/${fileName}`;

    const { error } = await supabase.storage
      .from('event-image')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('event-image')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };
  /* ---------------------------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase.from('events').insert({
        title: formData.title,
        image_url: imageUrl,
        event_type: formData.event_type,
        event_date: formData.date,
        event_time: formData.time,
        location: formData.location,
        about: formData.about,
        registration_url: formData.registration_url || null,
        published: formData.published,
      });

      if (error) throw error;

      toast.success('Event created successfully!');
      router.push('/events');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
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
          href="/events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Event</h1>
        <p className="text-gray-600 mt-1">Create a new event for your community</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Image
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={imageFile?.name || ''}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl"
                placeholder="Upload image"
              />

              <input
                type="file"
                accept="image/*"
                hidden
                id="event-image-input"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />

              <button
                type="button"
                onClick={() =>
                  document.getElementById('event-image-input')?.click()
                }
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            >
              <option value="live">Live Event</option>
              <option value="audio">Audio Event</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-xl"
            />
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="px-4 py-3 border border-gray-300 rounded-xl"
            />
          </div>

          {/* Location */}
          {formData.event_type === 'live' && (
            <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            placeholder="Location"
          />
          )}
          

          {/* About */}
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            placeholder='About Event'
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />

          {/* Registration URL */}
          <input
            type="url"
            name="registration_url"
            placeholder='Registeration Link (Optional)'
            value={formData.registration_url}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
          />

          {/* Publish */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Publish immediately
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary text-white py-3 rounded-xl font-semibold"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
            <Link
              href="/events"
              className="px-6 py-3 border rounded-xl font-semibold"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
