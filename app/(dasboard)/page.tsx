'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mic, Calendar, Book, Plus, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAudios: 0,
    publishedAudios: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalDoses: 0,
    todaysDose: false,
  });
  const [recentAudios, setRecentAudios] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch audio stats
      const { count: totalAudios } = await supabase
        .from('audios')
        .select('*', { count: 'exact', head: true });

      const { count: publishedAudios } = await supabase
        .from('audios')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      // Fetch event stats
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: upcomingEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString().split('T')[0]);

      // Fetch daily dose stats
      const { count: totalDoses } = await supabase
        .from('daily_dose')
        .select('*', { count: 'exact', head: true });

      const { data: todaysDose } = await supabase
        .from('daily_dose')
        .select('id')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      // Fetch recent audios
      const { data: audios } = await supabase
        .from('audios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      setStats({
        totalAudios: totalAudios || 0,
        publishedAudios: publishedAudios || 0,
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEvents || 0,
        totalDoses: totalDoses || 0,
        todaysDose: !!todaysDose,
      });

      setRecentAudios(audios || []);
      setUpcomingEvents(events || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your content management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Audios Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{stats.publishedAudios}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalAudios}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Audios</p>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            {stats.publishedAudios} published
          </div>
        </div>

        {/* Events Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {stats.upcomingEvents} upcoming
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalEvents}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Events</p>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 mr-1" />
            {stats.upcomingEvents} upcoming
          </div>
        </div>

        {/* Daily Dose Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Book className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              stats.todaysDose 
                ? 'text-green-600 bg-green-50' 
                : 'text-orange-600 bg-orange-50'
            }`}>
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalDoses}</h3>
          <p className="text-sm text-gray-600 mt-1">Daily Doses</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-linear-to-br from-primary to-secondary rounded-2xl p-6 text-white">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/teachings/new"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Audio
            </Link>
            <Link
              href="/events/new"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
            <Link
              href="/dose"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Set Daily Dose
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audios */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Audios</h2>
            <Link
              href="/teachings"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentAudios.length > 0 ? (
              recentAudios.map((audio) => (
                <Link
                  key={audio.id}
                  href={`/teachings/${audio.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {audio.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {audio.category} • {audio.duration_minutes}min
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      audio.published
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {audio.published ? 'Published' : 'Draft'}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No audios yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="gap-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.event_date).toLocaleDateString()} • {event.event_time}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                    {event.event_type}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}