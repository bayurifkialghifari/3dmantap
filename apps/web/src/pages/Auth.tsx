import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Box, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Field, Input, ErrorNotice } from '../components/atoms/ui';
export function Auth() {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const navigate = useNavigate(),
    client = useQueryClient();
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Box size={36} />
        <h1>
          Satu akun.
          <br />
          Banyak kemungkinan.
        </h1>
        <p>
          Simpan ide, lanjutkan desain, dan ikuti proses
          <br />
          sampai karyamu jadi nyata.
        </p>
        <span>
          <ShieldCheck size={17} /> Desainmu tetap milikmu.
        </span>
      </div>
      <section className="auth-form">
        <span className="eyebrow">SELAMAT DATANG DI STUDIOMU</span>
        <h2>{signup ? 'Mulai perjalanan kreatifmu.' : 'Senang bertemu lagi.'}</h2>
        <p>
          {signup
            ? 'Buat akun untuk menyimpan desain dan mengikuti pesanan.'
            : 'Masuk untuk melanjutkan idemu.'}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const f = new FormData(e.currentTarget);
            try {
              await api('/auth/' + (signup ? 'sign-up/email' : 'sign-in/email'), {
                method: 'POST',
                body: JSON.stringify({
                  email: f.get('email'),
                  password: f.get('password'),
                  ...(signup ? { name: f.get('name') } : {}),
                }),
              });
              await client.invalidateQueries();
              await navigate({ to: '/library' });
            } catch (err) {
              setError(err);
            }
            setBusy(false);
          }}
        >
          {signup && (
            <Field label="Nama">
              <Input name="name" autoComplete="name" required minLength={2} />
            </Field>
          )}
          <Field label="Email">
            <Input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="kamu@email.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              name="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              required
              minLength={12}
              placeholder="Minimal 12 karakter"
            />
          </Field>
          <ErrorNotice error={error} />
          <Button className="full large" disabled={busy}>
            {busy ? 'Sebentar…' : signup ? 'Buat akun' : 'Masuk'}
            <ArrowRight size={17} />
          </Button>
        </form>
        <p className="auth-switch">
          {signup ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            onClick={() => {
              setSignup(!signup);
              setError(null);
            }}
          >
            {signup ? 'Masuk' : 'Daftar sekarang'}
          </button>
        </p>
      </section>
    </div>
  );
}
