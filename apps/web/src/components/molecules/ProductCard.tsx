import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { rupiah, createDesign, priceDesign, type ProductTemplate } from '@3dmantap/shared';
import { ProductIllustration } from './ProductIllustration';
export function ProductCard({ template: t }: { template: ProductTemplate }) {
  return (
    <Link to="/product/$id" params={{ id: t.id }} className="product-card">
      <div className={'product-art ' + t.studio}>
        <ProductIllustration template={t} />
        <span className="card-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="product-info">
        <small>{t.category} / CUSTOM</small>
        <h3>{t.name}</h3>
        <p>Mulai {rupiah(priceDesign(t, createDesign(t)).unit)}</p>
      </div>
    </Link>
  );
}
