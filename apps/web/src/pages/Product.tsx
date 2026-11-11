import { Link, useParams } from '@tanstack/react-router';
import { ArrowUpRight, Check, Upload, Move3D } from 'lucide-react';
import { createDesign, priceDesign, rupiah } from '@3dmantap/shared';
import { useTemplates } from '../lib/hooks';
import { Viewer } from '../components/organisms/Viewer';
import { Badge, Loading, ErrorNotice } from '../components/atoms/ui';
import { ProductCard } from '../components/molecules/ProductCard';
export function Product() {
  const { id } = useParams({ strict: false });
  const { data: templates, isPending, error } = useTemplates();
  if (isPending) return <Loading />;
  const t = templates?.find((t) => t.id === id);
  if (!t) return <ErrorNotice error={error ?? 'Produk tidak ditemukan'} />;
  const d = createDesign(t);
  return (
    <div className="section product-page">
      <div className="breadcrumbs">
        <Link to="/">Beranda</Link> /{' '}
        <Link to="/catalog/$studio" params={{ studio: t.studio }}>
          {t.studio} studio
        </Link>{' '}
        / {t.name}
      </div>
      <div className="product-detail">
        <div className="detail-preview">
          <Viewer template={t} document={d} />
          <div className="preview-caption">
            <Move3D size={16} /> Ini model interaktif. Coba putar dari segala sudut.
          </div>
        </div>
        <div className="detail-copy">
          <Badge tone={t.studio === 'fashion' ? 'purple' : 'green'}>{t.category}</Badge>
          <h1>{t.name}</h1>
          <p>{t.description}</p>
          <div className="detail-price">
            <small>Estimasi mulai</small>
            <strong>{rupiah(priceDesign(t, d).unit)}</strong>
            <span>Harga final dikonfirmasi setelah konsultasi.</span>
          </div>
          <div className="detail-options">
            <span>Warna awal</span>
            <span className="swatch" style={{ background: t.color }} />
            <span>
              {t.sizes.length
                ? t.sizes.join(' · ')
                : Object.values(t.dimensions)
                    .map((n) => n / 10)
                    .join(' × ') + ' cm'}
            </span>
          </div>
          <Link to="/studio/$id" params={{ id: t.id }} className="button primary large full">
            Custom produk ini <ArrowUpRight size={19} />
          </Link>
          <ul className="feature-list">
            <li>
              <Check size={16} /> Desain dulu, konsultasi sebelum produksi
            </li>
            <li>
              <Upload size={16} /> Upload logo, stiker, atau artwork sendiri
            </li>
            <li>
              <Move3D size={16} /> Preview 3D mengikuti perubahanmu
            </li>
          </ul>
        </div>
      </div>
      <div className="section-heading related">
        <h2>Ide lainnya untukmu.</h2>
      </div>
      <div className="product-grid">
        {templates!
          .filter((x) => x.studio === t.studio && x.id !== t.id)
          .slice(0, 4)
          .map((x) => (
            <ProductCard key={x.id} template={x} />
          ))}
      </div>
    </div>
  );
}
