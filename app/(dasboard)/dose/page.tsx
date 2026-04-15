'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Check, Eye, Plus, ArrowLeft, Calendar, BookOpen, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';

type Devotional = {
  id: string;
  title: string;
  scripture: string;
  content: string;
  affirmation?: string;
  scheduled_date: string;
  created_at?: string;
};

type View = 'list' | 'form' | 'preview';

const emptyForm = {
  title: '',
  scripture: '',
  content: '',
  affirmation: '',
  scheduled_date: new Date().toISOString().split('T')[0],
};

export default function DailyDosePage() {
  const [view, setView] = useState<View>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [selectedDevo, setSelectedDevo] = useState<Devotional | null>(null);
  const [editingDevo, setEditingDevo] = useState<Devotional | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchAllDevotionals();
  }, []);

  const fetchAllDevotionals = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('daily_dose')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setDevotionals(data || []);
    } catch (error) {
      console.error('Failed to fetch devotionals:', error);
      toast.error('Failed to load devotionals');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewDevotion = () => {
    setEditingDevo(null);
    setFormData(emptyForm);
    setView('form');
  };

  const handleEditDevo = (devo: Devotional) => {
    setEditingDevo(devo);
    setFormData({
      title: devo.title,
      scripture: devo.scripture,
      content: devo.content,
      affirmation: devo.affirmation || '',
      scheduled_date: devo.scheduled_date,
    });
    setView('form');
  };

  const handleViewDevo = (devo: Devotional) => {
    setSelectedDevo(devo);
    setView('preview');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingDevo) {
        const { error } = await supabase
          .from('daily_dose')
          .update({
            title: formData.title,
            scripture: formData.scripture,
            content: formData.content,
            affirmation: formData.affirmation || null,
            scheduled_date: formData.scheduled_date,
          })
          .eq('id', editingDevo.id);

        if (error) throw error;
        toast.success('Devotional updated!');
      } else {
        const { error } = await supabase.from('daily_dose').insert({
          title: formData.title,
          scripture: formData.scripture,
          content: formData.content,
          affirmation: formData.affirmation || null,
          scheduled_date: formData.scheduled_date,
        });

        if (error) throw error;
        toast.success('Devotional created!');
      }

      await fetchAllDevotionals();
      setView('list');
      setEditingDevo(null);
      setFormData(emptyForm);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save devotional');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (devo: Devotional) => {
    if (!confirm('Are you sure you want to delete this devotional?')) return;

    try {
      const { error } = await supabase
        .from('daily_dose')
        .delete()
        .eq('id', devo.id);

      if (error) throw error;
      toast.success('Devotional deleted');
      await fetchAllDevotionals();
      if (view === 'preview') setView('list');
    } catch (error: any) {
      toast.error('Failed to delete devotional');
    }
  };

  const filteredDevotionals = devotionals.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.scripture.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const isUpcoming = (dateStr: string) => {
    return dateStr > new Date().toISOString().split('T')[0];
  };

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Dose</h1>
            <p className="text-gray-500 mt-1">{devotionals.length} devotional{devotionals.length !== 1 ? 's' : ''} scheduled</p>
          </div>
          <button
            onClick={handleNewDevotion}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold px-5 py-3 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            New Devotional
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or scripture..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
          />
        </div>

        {/* List */}
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredDevotionals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'No devotionals match your search' : 'No devotionals yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleNewDevotion}
                className="mt-4 text-secondary font-semibold hover:underline"
              >
                Create your first one →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDevotionals.map(devo => (
              <div
                key={devo.id}
                className={`bg-white rounded-2xl border p-5 flex items-center gap-4 group transition hover:shadow-sm ${
                  isToday(devo.scheduled_date)
                    ? 'border-secondary/40 bg-secondary/5'
                    : isUpcoming(devo.scheduled_date)
                    ? 'border-primary/30'
                    : 'border-gray-200'
                }`}
              >
                {/* Date badge */}
                <div className={`shrink-0 w-16 text-center rounded-xl p-2 ${
                  isToday(devo.scheduled_date)
                    ? 'bg-secondary text-white'
                    : isUpcoming(devo.scheduled_date)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {new Date(devo.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <p className="text-2xl font-bold leading-tight">
                    {new Date(devo.scheduled_date + 'T00:00:00').getDate()}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 truncate">{devo.title}</h3>
                    {isToday(devo.scheduled_date) && (
                      <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-semibold shrink-0">Today</span>
                    )}
                    {isUpcoming(devo.scheduled_date) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold shrink-0">Upcoming</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate italic">{devo.scripture}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleViewDevo(devo)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditDevo(devo)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(devo)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <ChevronRight
                  className="w-4 h-4 text-gray-300 shrink-0 cursor-pointer"
                  onClick={() => handleViewDevo(devo)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── FORM VIEW ───────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setView('list'); setEditingDevo(null); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingDevo ? 'Edit Devotional' : 'New Devotional'}
            </h1>
            <p className="text-gray-500 mt-0.5">
              {editingDevo ? `Editing: ${editingDevo.title}` : 'Schedule a new daily dose'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          {/* Scheduled Date */}
          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Scheduled Date *</span>
            </label>
            <input
              type="date"
              id="scheduled_date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
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
            <label htmlFor="scripture" className="block text-sm font-semibold text-gray-700 mb-2">Today's Word *</label>
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
            <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">Truth *</label>
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
            <p className="text-xs text-gray-400 mt-1">{formData.content.length} characters</p>
          </div>

          {/* Affirmation */}
          <div>
            <label htmlFor="affirmation" className="block text-sm font-semibold text-gray-700 mb-2">Today's Task</label>
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

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Check className="w-5 h-5" />
                  {editingDevo ? 'Save Changes' : 'Create Devotional'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setView('list'); setEditingDevo(null); }}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Live Preview */}
        {formData.title && (
          <div className="bg-linear-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Live Preview</h3>
              {formData.scheduled_date && (
                <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(formData.scheduled_date)}
                </span>
              )}
            </div>
            <div className="bg-white rounded-xl p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">{formData.title}</h2>
              <div className="border-l-4 border-primary pl-4">
                <p className="text-gray-700 italic">{formData.scripture}</p>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{formData.content}</p>
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

  // ─── PREVIEW VIEW ────────────────────────────────────────────────────────────
  if (view === 'preview' && selectedDevo) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedDevo.title}</h1>
              <p className="text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(selectedDevo.scheduled_date)}
                {isToday(selectedDevo.scheduled_date) && (
                  <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-semibold">Today</span>
                )}
                {isUpcoming(selectedDevo.scheduled_date) && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Upcoming</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditDevo(selectedDevo)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleDelete(selectedDevo)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Devotional Content */}
        <div className="bg-linear-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary/20">
          <div className="bg-white rounded-xl p-8 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">{selectedDevo.title}</h2>
            <div className="border-l-4 border-primary pl-5">
              <p className="text-gray-700 italic text-lg leading-relaxed">{selectedDevo.scripture}</p>
            </div>
            <p className="text-gray-700 leading-loose text-base whitespace-pre-wrap">{selectedDevo.content}</p>
            {selectedDevo.affirmation && (
              <div className="bg-primary/10 rounded-xl p-5">
                <p className="font-semibold text-gray-900 text-lg">✨ {selectedDevo.affirmation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}