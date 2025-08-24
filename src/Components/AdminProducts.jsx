import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const AdminProducts = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/products', {
        params: { page, limit, search, sort, order }
      });
      if (res.data.success) {
        let rows = res.data.products || [];
        if (onlyActive) rows = rows.filter(r => r.is_active);
        if (onlyFeatured) rows = rows.filter(r => r.is_featured);
        setItems(rows);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error('Admin products load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, sort, order, onlyActive, onlyFeatured]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  if (!isAuthenticated || currentUser?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#fff9f5] pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#064232] via-[#8c7c68] to-[#d3756b] text-white">
        <div className="container mx-auto max-w-7xl px-4 py-10 mt-16">
          <h1 className="text-3xl md:text-4xl font-extrabold">All Products</h1>
          <p className="opacity-90 mt-2 text-sm md:text-base">Search and review every product across all stores</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Toolbar */}
        <form onSubmit={onSearch} className="bg-white border border-[#e7dcca] rounded-2xl p-4 shadow-sm -mt-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  className="w-full bg-[#fff9f5] border border-[#e7dcca] focus:border-[#d3756b] focus:ring-2 focus:ring-[#d3756b]/20 rounded-xl pl-10 pr-3 py-2"
                  placeholder="Product, Store, Category"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sort</label>
              <select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-[#fff9f5] border border-[#e7dcca] rounded-xl px-3 py-2">
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="sale_price">Sale Price</option>
                <option value="stock">Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Order</label>
              <select value={order} onChange={(e)=>setOrder(e.target.value)} className="bg-[#fff9f5] border border-[#e7dcca] rounded-xl px-3 py-2">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Page size</label>
              <select value={limit} onChange={(e)=>setLimit(Number(e.target.value))} className="bg-[#fff9f5] border border-[#e7dcca] rounded-xl px-3 py-2">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-xl px-4 py-2">Search</button>
              <button type="button" onClick={()=>{ setSearch(''); setPage(1); fetchData(); }} className="bg-[#fff3ee] text-[#5e3023] border border-[#e7dcca] rounded-xl px-4 py-2">Clear</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyActive} onChange={e=>{ setOnlyActive(e.target.checked); setPage(1); }} className="rounded" />
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Active only</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyFeatured} onChange={e=>{ setOnlyFeatured(e.target.checked); setPage(1); }} className="rounded" />
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Featured only</span>
            </label>
            <span className="ml-auto text-xs text-gray-500">Results: {total}</span>
          </div>
        </form>

        {/* Table */}
        <div className="mt-6 overflow-x-auto border border-[#e7dcca] rounded-2xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f5e6d3] sticky top-0 z-10">
              <tr>
                <Th>Name</Th>
                <Th>Store</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th>Status</Th>
                <Th>Featured</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 bg-[#fff3ee] rounded"/>
                    <div className="h-3 bg-[#fff3ee] rounded w-2/3"/>
                    <div className="h-3 bg-[#fff3ee] rounded w-5/6"/>
                  </div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No results. Try adjusting filters or search terms.</td></tr>
              ) : (
                items.map(row => (
                  <tr key={row.product_id} className="hover:bg-[#fff9f5] transition-colors">
                    <Td>
                      <div className="flex items-center gap-2">
                        <Link to={`/product/${row.product_id}`} className="font-semibold text-[#5e3023] hover:underline decoration-[#d3756b]">
                          {row.product_name}
                        </Link>
                        <Link to={`/product/${row.product_id}`} className="text-[#d3756b] hover:text-[#c25d52]" aria-label="Open product in new tab" target="_blank" rel="noopener noreferrer">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586L7.293 11.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z"/></svg>
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500">ID: {String(row.product_id).slice(0,8)} • {row.category_name}</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#fff3ee] flex items-center justify-center text-[#d3756b] text-xs font-bold">
                          {(row.store_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[#5e3023]">{row.store_name}</div>
                          {row.store_city && <div className="text-xs text-gray-500">{row.store_city}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#e7dcca] text-[#064232]">
                        {row.category_name}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="font-semibold text-[#5e3023]">
                        {row.sale_price ? (
                          <div className="space-y-0.5">
                            <div className="text-[#d3756b]">{money(row.sale_price)}</div>
                            <div className="text-xs text-gray-500 line-through">{money(row.price)}</div>
                          </div>
                        ) : money(row.price)}
                      </div>
                      {row.sale_price && row.price && row.price > 0 && (
                        <div className="text-xs text-green-700">-{discountPct(row.price, row.sale_price)}%</div>
                      )}
                    </Td>
                    <Td className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${row.stock_quantity === 0 ? 'bg-red-100 text-red-700' : row.stock_quantity <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {row.stock_quantity}
                      </span>
                    </Td>
                    <Td>
                      <span className={`px-2 py-1 rounded-full text-xs ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </Td>
                    <Td>
                      {row.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.803 2.037a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 14.347l-2.383 1.927c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.98 8.72c-.783-.57-.38-1.81.588-1.81H8.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </Td>
                    <Td>{new Date(row.date_created).toLocaleDateString()}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="text-sm text-gray-600">Showing {(items.length ? (offset(page, limit) + 1) : 0)} - {offset(page, limit) + items.length} of {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 border border-[#e7dcca] rounded-lg bg-white disabled:opacity-50">Prev</button>
            <PageDots total={Math.max(1, Math.ceil(total/limit))} page={page} setPage={setPage} />
            <button disabled={(offset(page, limit)+items.length)>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 border border-[#e7dcca] rounded-lg bg-white disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Th = ({ children, className='' }) => (
  <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#5e3023] ${className}`}>{children}</th>
);
const Td = ({ children, className='' }) => (
  <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
);
const money = (v) => {
  if (v === null || v === undefined) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Number(v)).replace('PKR','Rs.');
};
const offset = (page, limit) => (page-1)*limit;

const discountPct = (price, sale) => {
  const p = Number(price), s = Number(sale);
  if (!p || !s || s >= p) return 0;
  return Math.round(((p - s) / p) * 100);
};

const PageDots = ({ total, page, setPage }) => {
  // show up to 7 with ellipsis
  if (total <= 7) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={()=>setPage(n)} className={`w-8 h-8 rounded-lg border border-[#e7dcca] ${n===page ? 'bg-[#d3756b] text-white' : 'bg-white'}`}>{n}</button>
        ))}
      </div>
    );
  }
  const btn = (n, key) => (
    <button key={key ?? n} onClick={()=>setPage(n)} className={`w-8 h-8 rounded-lg border border-[#e7dcca] ${n===page ? 'bg-[#d3756b] text-white' : 'bg-white'}`}>{n}</button>
  );
  const parts = [];
  parts.push(btn(1));
  if (page > 3) parts.push(<span key="s1" className="px-2">…</span>);
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  for (let n = start; n <= end; n++) parts.push(btn(n));
  if (page < total - 2) parts.push(<span key="s2" className="px-2">…</span>);
  parts.push(btn(total));
  return <div className="flex items-center gap-1">{parts}</div>;
};

export default AdminProducts;
