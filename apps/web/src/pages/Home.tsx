import { Link } from '@tanstack/react-router';
import {
  ArrowUpRight,
  ArrowRight,
  Shirt,
  Armchair,
  Move3D,
  Upload,
  MessageCircle,
  Check,
  Box,
  Sparkles,
} from 'lucide-react';
import { createDesign } from '@3dmantap/shared';
import { useTemplates } from '../lib/hooks';
import { Viewer } from '../components/organisms/Viewer';
import { ProductCard } from '../components/molecules/ProductCard';
import { Badge, Loading, ErrorNotice } from '../components/atoms/ui';
export function Home() {
  const { data: templates, isPending, error } = useTemplates();
  if (isPending) return <Loading />;
  if (!templates) return <ErrorNotice error={error} />;
  if (!templates.length)
    return (
      <div className="empty">
        <h1>Koleksi sedang disiapkan.</h1>
        <p>Tim 3DMantap sedang menyiapkan template untuk idemu.</p>
      </div>
    );
  const hero = templates.find((t) => t.modelKind === 'shirt') ?? templates[0],
    interior = templates.find((t) => t.modelKind === 'shelf') ?? templates[0];
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <Badge tone="green">
            <span className="live-dot" /> RUANG UNTUK IDE BESARMU
          </Badge>
          <h1>
            Bukan sekadar pilih.
            <br />
            Bikin jadi <em>kamu.</em>
          </h1>
          <p>
            Dari kaos favorit sampai sudut rumah.
            <br />
            Rancang sendiri, lihat dalam 3D, lalu wujudkan
            <br className="desktop" /> bersama tim yang mengerti idemu.
          </p>
          <div className="hero-actions">
            <Link
              className="button primary large"
              to="/catalog/$studio"
              params={{ studio: 'fashion' }}
            >
              Mulai berkarya <ArrowUpRight size={19} />
            </Link>
            <a href="#studios" className="text-link">
              Jelajahi studio <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <Check size={14} /> Desain gratis
            </span>
            <span>
              <Check size={14} /> Preview 3D langsung
            </span>
            <span>
              <Check size={14} /> Konsultasi dulu
            </span>
          </div>
        </div>
        <div className="hero-stage">
          <div className="stage-top">
            <span>
              <span className="live-dot" /> YOUR IDEA, IN 3D
            </span>
            <span>01 / FASHION</span>
          </div>
          <div className="hero-viewer">
            <Viewer
              template={hero}
              document={{
                ...createDesign(hero),
                layers: [
                  {
                    id: 'hero',
                    kind: 'text',
                    surfaceId: 'front',
                    text: 'YOUR\nSTORY.',
                    font: 'sans',
                    color: '#244c3e',
                    x: 0,
                    y: 0,
                    width: 170,
                    height: 54,
                    rotation: 0,
                    opacity: 1,
                  },
                ],
              }}
            />
          </div>
          <div className="floating-tag">
            <Sparkles size={17} />
            <div>
              100% caramu.<small>Warna, detail, cerita.</small>
            </div>
          </div>
          <div className="stage-bottom">
            <span className="color-dot" style={{ background: hero.color }} />
            <span>Everyday Tee · Natural</span>
            <span className="stage-drag">
              <Move3D size={14} /> Putar sesukamu
            </span>
          </div>
        </div>
        <div className="hero-bottom-label">FASHION / INTERIOR / ENDLESS POSSIBILITIES</div>
      </section>
      <div className="promise-strip">
        <span>
          <Box size={18} /> Dibuat khusus untukmu
        </span>
        <span>
          <Upload size={18} /> Upload desain sendiri
        </span>
        <span>
          <Move3D size={18} /> Lihat sebelum dibuat
        </span>
        <span>
          <MessageCircle size={18} /> Ngobrol dulu, baru produksi
        </span>
      </div>
      <section id="studios" className="section studios">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DUA STUDIO. SATU IMAJINASI.</span>
            <h2>Mau bikin apa hari ini?</h2>
          </div>
          <p>
            Mulai dari template.
            <br />
            Akhiri dengan sesuatu yang cuma kamu punya.
          </p>
        </div>
        <div className="studio-cards">
          <Link
            to="/catalog/$studio"
            params={{ studio: 'fashion' }}
            className="studio-card fashion-studio"
          >
            <div>
              <span className="studio-icon">
                <Shirt size={23} />
              </span>
              <span className="eyebrow">01 / FASHION</span>
              <h3>Pakai ceritamu.</h3>
              <p>
                Baju, hoodie, jaket, topi, sepatu.
                <br />
                Warna dan artwork yang kamu banget.
              </p>
              <span className="studio-link">
                Buka Fashion Studio <ArrowUpRight size={19} />
              </span>
            </div>
            <div className="studio-visual fashion-visual">
              <span className="visual-word">
                YOUR
                <br />
                STORY.
              </span>
              <svg viewBox="0 0 250 250">
                <path
                  d="M72 47 100 33q25 18 50 0l28 14 44 57-37 28-22-30 6 112H81l6-112-22 30-37-28Z"
                  fill="#e5dfd0"
                />
                <path d="M99 35q25 44 52 0" fill="none" stroke="#bcbaa8" strokeWidth="6" />
              </svg>
            </div>
          </Link>
          <Link
            to="/catalog/$studio"
            params={{ studio: 'interior' }}
            className="studio-card interior-studio"
          >
            <div>
              <span className="studio-icon">
                <Armchair size={23} />
              </span>
              <span className="eyebrow">02 / INTERIOR</span>
              <h3>Ruang yang pas.</h3>
              <p>
                Meja, lemari, rak, dan detail rumah.
                <br />
                Ukuran presisi untuk ruangmu.
              </p>
              <span className="studio-link">
                Buka Interior Studio <ArrowUpRight size={19} />
              </span>
            </div>
            <div className="studio-visual interior-visual">
              <Viewer template={interior} document={createDesign(interior)} interactive={false} />
            </div>
          </Link>
        </div>
      </section>
      <section className="section collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TITIK MULAI YANG BAGUS</span>
            <h2>Template pilihan, sentuhanmu.</h2>
          </div>
          <Link to="/catalog/$studio" params={{ studio: 'fashion' }} className="text-link">
            Lihat semua template <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {['everyday-tee', 'essential-hoodie', 'signature-cap', 'modular-wardrobe']
            .map((id) => templates.find((t) => t.id === id))
            .filter((t): t is typeof hero => !!t)
            .map((t) => (
              <ProductCard key={t.id} template={t} />
            ))}
        </div>
        <p className="demo-caption">
          Koleksi dan harga awal merupakan contoh. Spesifikasi serta harga final dikonfirmasi saat
          konsultasi.
        </p>
      </section>
      <section className="room-banner">
        <div>
          <Badge>BUKAN CUMA BAYANGAN</Badge>
          <h2>
            Coba di ruanganmu.
            <br />
            Sebelum ada di ruanganmu.
          </h2>
          <p>
            Tata furnitur, gambar denah, dan lihat hasilnya
            <br />
            dari setiap sudut dengan Room Planner.
          </p>
          <Link to="/room-planner" className="button light">
            Jelajahi Room Planner <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="room-mini">
          <div className="room-wall back" />
          <div className="room-wall side" />
          <div className="room-floor" />
          <div className="room-furni one" />
          <div className="room-furni two" />
          <span className="room-measure">500 cm</span>
          <span className="room-mini-label">
            <Move3D size={15} /> DENAH 2D ⇄ RUANG 3D
          </span>
        </div>
      </section>
      <section className="section how">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DARI IDE JADI NYATA</span>
            <h2>Sesimpel satu, dua, jadi.</h2>
          </div>
          <p>
            Kamu pegang kendali.
            <br />
            Kami bantu mewujudkan.
          </p>
        </div>
        <div className="steps">
          {[
            [
              '01',
              'Rancang sesukamu',
              'Pilih template, atur detail, tambahkan desainmu. Lihat hasilnya langsung dalam 3D.',
              <Move3D />,
            ],
            [
              '02',
              'Konsultasikan idemu',
              'Submit desain ke aplikasi, lalu ngobrol lewat WhatsApp untuk memastikan semuanya pas.',
              <MessageCircle />,
            ],
            [
              '03',
              'Setuju, baru dibuat',
              'Konfirmasi desain dan harga final. Setelah pembayaran diverifikasi, tim mulai produksi.',
              <Check />,
            ],
          ].map(([n, title, description, icon]) => (
            <article key={String(n)}>
              <div className="step-top">
                <span>{n}</span>
                {icon}
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="final-cta">
        <span className="eyebrow">IDE BAGUS JANGAN CUMA DIKEPALA.</span>
        <h2>Yuk, bikin jadi nyata.</h2>
        <Link to="/catalog/$studio" params={{ studio: 'fashion' }} className="button primary large">
          Masuk studio <ArrowUpRight size={19} />
        </Link>
      </section>
    </div>
  );
}
