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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from('events').insert({
        title: formData.title,
        image_url: formData.image_url || null,
        event_type: formData.event_type,
        date: formData.date,
        time: formData.time,
        location: formData.location || null,
        about: formData.about || null,
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
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g., Sunday Worship Service"
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-semibold text-gray-700 mb-2">
              Event Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="https://example.com/event-image.jpg"
              />
              <button
                type="button"
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-2"
                title="Upload image"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="event_type" className="block text-sm font-semibold text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="live">Live Event</option>
              <option value="audio">Audio Event</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-2">
                Event Time *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g., Main Sanctuary, 123 Faith Street"
            />
          </div>

          {/* About */}
          <div>
            <label htmlFor="about" className="block text-sm font-semibold text-gray-700 mb-2">
              About the Event
            </label>
            <textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Describe what attendees can expect..."
            />
          </div>

          {/* Registration URL */}
          <div>
            <label htmlFor="registration_url" className="block text-sm font-semibold text-gray-700 mb-2">
              Registration URL (Optional)
            </label>
            <input
              type="url"
              id="registration_url"
              name="registration_url"
              value={formData.registration_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="https://example.com/register"
            />
            <p className="text-xs text-gray-500 mt-2">
              Link where users can register or get more information
            </p>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="published"
              name="published"
              checked={formData.published}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately (make visible to app users)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
            <Link
              href="/events"
              className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}