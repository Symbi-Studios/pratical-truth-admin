'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Check, Eye } from 'lucide-react';

export default function DailyDosePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [existingDose, setExistingDose] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    scripture: '',
    content: '',
    affirmation: '',
  });

  useEffect(() => {
    fetchDoseForDate();
  }, []);

  const fetchDoseForDate = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_dose')
        .select('*')
        .single();

      if (data) {
        setExistingDose(data);
        setFormData({
          title: data.title,
          scripture: data.scripture,
          content: data.content,
          affirmation: data.affirmation || '',
        });
      } else {
        setExistingDose(null);
        setFormData({
          title: '',
          scripture: '',
          content: '',
          affirmation: '',
        });
      }
    } catch (error) {
      console.log('No devotional found for this date');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (existingDose) {
        // Update existing
        const { error } = await supabase
          .from('daily_dose')
          .update({
            title: formData.title,
            scripture: formData.scripture,
            content: formData.content,
            affirmation: formData.affirmation || null,
          })
          .eq('id', existingDose.id);

        if (error) throw error;
        toast.success('Daily dose updated successfully!');
      } else {
        // Create new
        const { error } = await supabase.from('daily_dose').insert({
          title: formData.title,
          scripture: formData.scripture,
          content: formData.content,
          affirmation: formData.affirmation || null,
        });

        if (error) throw error;
        toast.success('Daily dose created successfully!');
      }

      fetchDoseForDate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save daily dose');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingDose) return;
    if (!confirm('Are you sure you want to delete this daily dose?')) return;

    try {
      const { error } = await supabase
        .from('daily_dose')
        .delete()
        .eq('id', existingDose.id);

      if (error) throw error;

      toast.success('Daily dose deleted successfully');
      setExistingDose(null);
      setFormData({
        title: '',
        scripture: '',
        content: '',
        affirmation: '',
      });
    } catch (error: any) {
      toast.error('Failed to delete daily dose');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Dose Editor</h1>
        <p className="text-gray-600 mt-1">
          Create or edit the daily devotional content
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g., Trust in the Lord"
            />
          </div>

          {/* Scripture */}
          <div>
            <label htmlFor="scripture" className="block text-sm font-semibold text-gray-700 mb-2">
              Today's Word *
            </label>
            <textarea
              id="scripture"
              name="scripture"
              value={formData.scripture}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="e.g., Trust in the Lord with all your heart... - Proverbs 3:5-6"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
              Truth *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Write the main devotional message..."
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData.content.length} characters
            </p>
          </div>

          {/* Affirmation */}
          <div>
            <label htmlFor="affirmation" className="block text-sm font-semibold text-gray-700 mb-2">
              Today's Task
            </label>
            <input
              type="text"
              id="affirmation"
              name="affirmation"
              value={formData.affirmation}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g., I trust God completely with my life"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Saving...'
              ) : existingDose ? (
                <>
                  <Check className="w-5 h-5" />
                  Update Daily Dose
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Daily Dose
                </>
              )}
            </button>
            {existingDose && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 border-2 border-red-300 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Preview Card */}
      {formData.title && (
        <div className="from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">Preview</h3>
          </div>
          <div className="bg-white rounded-xl p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">{formData.title}</h2>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-gray-800 italic">{formData.scripture}</p>
            </div>
            <p className="text-gray-700 leading-relaxed">{formData.content}</p>
            {formData.affirmation && (
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="font-semibold text-gray-900">✨ {formData.affirmation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}