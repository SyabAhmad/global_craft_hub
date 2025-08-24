import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  const events = overview?.events30d || { views: 0, clicks: 0, add_to_cart: 0, purchases: 0 };
  const totalEvents = useMemo(() => {
    const v = Number(events.views || 0);
    const c = Number(events.clicks || 0);
    const a = Number(events.add_to_cart || 0);
    const p = Number(events.purchases || 0);
    return v + c + a + p;
  }, [events]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analyticsService.getAdminOverview();
        setOverview(data);
      } catch (e) {
        console.error('Failed to load admin overview', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#064232] via-[#8c7c68] to-[#d3756b] text-white  pt-20">
        <div className="container mx-auto max-w-7xl px-4 py-12 mt-16">
          <h1 className="text-3xl md:text-4xl font-extrabold">Superadmin Dashboard</h1>
          <p className="opacity-90 mt-2 text-sm md:text-base">Platform-wide overview and quick insights</p>
          <div className="mt-4">
            <Link to="/admin/products" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg">
              <span>View All Products</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {overview && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard label="Users" value={overview.summary?.users || 0} icon="user" color="from-[#e7dcca] to-white" />
              <KpiCard label="Stores" value={overview.summary?.stores || 0} icon="store" color="from-[#fff3ee] to-white" />
              <KpiCard label="Products" value={overview.summary?.products || 0} icon="box" color="from-[#f7f3ea] to-white" />
              <KpiCard label="Orders" value={overview.summary?.orders || 0} icon="cart" color="from-[#f6e7e4] to-white" />
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Events */}
              <div className="p-6 bg-white rounded-2xl border border-[#e7dcca] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#064232]">Engagement (last 30 days)</h2>
                  <span className="text-xs text-gray-500">Total: {totalEvents}</span>
                </div>
                <div className="space-y-4">
                  <EventBar label="Views" value={events.views || 0} total={totalEvents} barClass="bg-[#8c7c68]" />
                  <EventBar label="Clicks" value={events.clicks || 0} total={totalEvents} barClass="bg-[#5e3023]" />
                  <EventBar label="Add to cart" value={events.add_to_cart || 0} total={totalEvents} barClass="bg-[#d3a97f]" />
                  <EventBar label="Purchases" value={events.purchases || 0} total={totalEvents} barClass="bg-[#d3756b]" />
                </div>
              </div>

              {/* Top stores */}
              <div className="p-6 bg-white rounded-2xl border border-[#e7dcca] shadow-sm">
                <h2 className="font-semibold text-[#064232] mb-4">Top Stores (purchases in last 30 days)</h2>
                <ul className="divide-y">
                  {(overview.topStores || []).length === 0 && (
                    <li className="py-6 text-sm text-gray-500">No data yet</li>
                  )}
                  {(overview.topStores || []).map((s, idx) => (
                    <li key={s.store_id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#fff3ee] text-[#5e3023] font-semibold">{idx+1}</span>
                        <div>
                          <div className="font-medium text-[#5e3023]">{s.name}</div>
                          {s.city && <div className="text-xs text-gray-500">{s.city}</div>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold bg-[#e7dcca] text-[#064232] px-2 py-1 rounded">{s.purchases}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, icon = 'box', color = 'from-white to-white' }) => (
  <div className={`p-5 rounded-2xl bg-gradient-to-b ${color} border border-[#e7dcca] shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-2xl font-extrabold text-[#5e3023]">{formatNumber(value)}</div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#fff9f5] flex items-center justify-center text-[#d3756b]">
        {icon === 'user' && (
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 10a4 4 0 100-8 4 4 0 000 8z"/><path fillRule="evenodd" d="M.458 16.042A10 10 0 0110 2v0a10 10 0 019.542 14.042A12.944 12.944 0 0010 13a12.944 12.944 0 00-9.542 3.042z" clipRule="evenodd"/></svg>
        )}
        {icon === 'store' && (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16l-1 7H5L4 4zm1 9h14v7H5v-7z"/></svg>
        )}
        {icon === 'box' && (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V8a2 2 0 00-1-1.73L13 2.27a2 2 0 00-2 0L4 6.27A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/></svg>
        )}
        {icon === 'cart' && (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/><path d="M7 6h14l-1.34 6.34a2 2 0 01-1.97 1.66H9.53l-.4 2h10.87v2H7a1 1 0 01-1-.78L3.11 4H1V2h3a1 1 0 01.97.76L5.6 6H7z"/></svg>
        )}
      </div>
    </div>
  </div>
);

const EventBar = ({ label, value, total, barClass }) => {
  const pct = total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[#5e3023]">{label}</span>
        <span className="text-gray-600">{value} ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-[#f5e6d3] rounded-full overflow-hidden">
        <div className={`${barClass} h-2`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

const formatNumber = (n) => {
  const v = Number(n || 0);
  return new Intl.NumberFormat('en-US').format(v);
};

export default AdminDashboard;
