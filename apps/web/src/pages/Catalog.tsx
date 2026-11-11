import { useParams, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { useTemplates } from '../lib/hooks';
import { Input, Badge, Loading, ErrorNotice } from '../components/atoms/ui';
import { ProductCard } from '../components/molecules/ProductCard';
export function Catalog() {
  const { studio } = useParams({ strict: false });
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('Semua'),
    [sort, setSort] = useState('featured');
  const { data: all, isPending, error } = useTemplates();
  if (isPending) return <Loading />;
  const templates = (all ?? []).filter((t) => t.studio === studio);
  const categories = ['Semua', ...new Set(templates.map((t) => t.category))];
  const list = templates
    .filter(
      (t) =>
        (category === 'Semua' || t.category === category) &&
        t.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'price'
        ? a.basePrice - b.basePrice
        : sort === 'name'
          ? a.name.localeCompare(b.name)
          : 0,
    );
  return (
    <div className="section catalog-page">
      <div className="breadcrumbs">
        <Link to="/">Beranda</Link> / {studio === 'fashion' ? 'Fashion' : 'Interior'} Studio
      </div>
      <div className="catalog-heading">
        <div>
          <Badge tone={studio === 'fashion' ? 'purple' : 'green'}>
            {studio === 'fashion' ? 'FASHION' : 'INTERIOR'} STUDIO
          </Badge>
          <h1>{studio === 'fashion' ? 'Fashion Studio.' : 'Interior Studio.'}</h1>
          <p>
            {studio === 'fashion'
              ? 'Pakaian, topi, sepatu, dan aksesori. Pilih satu untuk mulai custom.'
              : 'Furnitur dan detail ruang. Atur ukuran, finishing, dan artwork sesuai kebutuhan.'}
          </p>
        </div>
        {studio === 'interior' && (
          <Link to="/room-planner" className="button secondary">
            Buka Room Planner <ArrowUpRight size={17} />
          </Link>
        )}
      </div>
      <div className="catalog-controls">
        <div className="search-box">
          <Search size={18} />
          <Input
            aria-label="Cari template"
            placeholder="Cari template favoritmu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sort-box">
          <SlidersHorizontal size={16} />
          <select aria-label="Urutkan" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Pilihan studio</option>
            <option value="price">Harga terendah</option>
            <option value="name">Nama A–Z</option>
          </select>
        </div>
      </div>
      <div className="category-tabs">
        {categories.map((c) => (
          <button key={c} className={c === category ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <ErrorNotice error={error} />
      <div className="catalog-meta">
        <span>{list.length} template untuk idemu</span>
        <span>Semua bisa dipreview dalam 3D</span>
      </div>
      <div className="product-grid">
        {list.map((t) => (
          <ProductCard key={t.id} template={t} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">Belum ada template yang cocok dengan pencarianmu.</div>
      )}
    </div>
  );
}
