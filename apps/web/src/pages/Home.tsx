import { Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useTemplates } from '../lib/hooks';
import { ProductCard } from '../components/molecules/ProductCard';
import { Loading, ErrorNotice } from '../components/atoms/ui';
export function Home() {
  const { data: templates, isPending, error } = useTemplates();
  if (isPending) return <Loading />;
  if (!templates) return <ErrorNotice error={error} />;
  const picks = ['everyday-tee', 'signature-cap', 'canvas-sneaker', 'low-sideboard']
    .map((id) => templates.find((t) => t.id === id))
    .filter((t) => !!t);
  return (
    <div className="showroom">
      <div className="showroom-kicker">
        <span>FASHION, FURNITURE & EVERYTHING PERSONAL.</span>
        <span>DESAIN DISETUJUI, BARU DIPRODUKSI.</span>
      </div>
      <section className="showroom-hero">
        <div className="showroom-copy">
          <span className="overline">MADE TO ORDER</span>
          <h1>
            Bikin yang pas
            <br />
            buatmu.
          </h1>
          <p>
            Pilih produknya. Tentukan warna, ukuran, dan artwork. Kita ngobrol dulu sebelum mulai
            membuatnya.
          </p>
          <Link
            className="button primary large"
            to="/catalog/$studio"
            params={{ studio: 'fashion' }}
          >
            Mulai desain <ArrowUpRight size={19} />
          </Link>
          <Link to="/room-planner" className="showroom-secondary">
            Coba room planner <ArrowRight size={16} />
          </Link>
        </div>
        <Link to="/product/$id" params={{ id: 'signature-cap' }} className="showroom-cover">
          <span className="cover-index">01 / STUDIO FASHION</span>
          <img
            src="/models/previews/studio-edition.webp"
            alt="Bucket hat custom berwarna hijau dengan tulisan MANTAP mengikuti permukaannya"
          />
          <div className="cover-caption">
            <div>
              <strong>Canvas Bucket Hat</strong>
              <span>Contoh custom. Tulis versi kamu.</span>
            </div>
            <span className="cover-action">
              <ArrowUpRight size={23} />
            </span>
          </div>
        </Link>
      </section>
      <section className="showroom-studios" id="studios">
        <Link
          to="/catalog/$studio"
          params={{ studio: 'fashion' }}
          className="showroom-studio fashion"
        >
          <div className="studio-heading">
            <span>01 / FASHION</span>
            <ArrowUpRight size={24} />
          </div>
          <div className="studio-photo">
            <img
              src="/models/previews/hoodie.webp"
              alt="Hoodie custom dengan detail kantong, rib, dan tudung"
            />
          </div>
          <div className="studio-description">
            <h2>Yang kamu pakai.</h2>
            <p>Kaos, hoodie, jaket, topi, sepatu, dan tas.</p>
            <span>
              Buka Fashion Studio <ArrowRight size={16} />
            </span>
          </div>
        </Link>
        <Link
          to="/catalog/$studio"
          params={{ studio: 'interior' }}
          className="showroom-studio interior"
        >
          <div className="studio-heading">
            <span>02 / INTERIOR</span>
            <ArrowUpRight size={24} />
          </div>
          <div className="studio-photo">
            <img
              src="/models/previews/sideboard.webp"
              alt="Kabinet kayu dengan material PBR dan detail pintu"
            />
          </div>
          <div className="studio-description">
            <h2>Yang mengisi ruangmu.</h2>
            <p>Meja, lemari, rak, pintu, dan panel sesuai ukuran.</p>
            <span>
              Buka Interior Studio <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      </section>
      <section className="showroom-collection">
        <div className="showroom-section-title">
          <div>
            <span className="overline">START WITH A GOOD PIECE</span>
            <h2>Pilihan studio.</h2>
          </div>
          <Link to="/catalog/$studio" params={{ studio: 'fashion' }}>
            Lihat koleksi <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {picks.map((t) => (
            <ProductCard key={t.id} template={t} />
          ))}
        </div>
      </section>
      <section className="showroom-room">
        <div className="room-editorial">
          <span className="overline">BEFORE IT BECOMES REAL</span>
          <h2>
            Ukur dulu.
            <br />
            Tata dulu.
          </h2>
          <p>
            Coba komposisi furnitur di denahmu. Lihat ukuran dan jaraknya sebelum menyepakati
            produksi.
          </p>
          <Link to="/room-planner" className="button primary large">
            Buka Room Planner <ArrowUpRight size={18} />
          </Link>
        </div>
        <Link to="/room-planner" className="room-editorial-image">
          <img
            src="/models/previews/room.webp"
            alt="Denah ruangan 3D dengan furnitur kayu dan bukaan dinding"
          />
          <span>DENAH 2D / PREVIEW 3D</span>
        </Link>
      </section>
      <section className="showroom-process">
        <div className="showroom-section-title">
          <h2>Desain. Diskusi. Produksi.</h2>
          <span>THREE STEPS / ONE GOOD RESULT</span>
        </div>
        {[
          ['01', 'Buat desainmu', 'Atur produk dan artwork, lalu simpan pengajuan ke aplikasi.'],
          [
            '02',
            'Diskusikan via WhatsApp',
            'Tim memastikan ukuran, bahan, detail cetak, dan harga final.',
          ],
          [
            '03',
            'Setujui, lalu dibuat',
            'Produksi dimulai setelah desain disetujui dan transfer diverifikasi.',
          ],
        ].map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <ArrowUpRight size={22} />
          </article>
        ))}
      </section>
    </div>
  );
}
