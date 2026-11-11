import { useState, useRef } from 'react';
import { Send, Check } from 'lucide-react';
import type { DesignDocument, Inquiry } from '@3dmantap/shared';
import { api } from '../../lib/api';
import { Modal, Field, Input, Button, ErrorNotice } from '../../components/atoms/ui';
export function SubmitDialog({
  document,
  onClose,
}: {
  document: DesignDocument;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const key = useRef(crypto.randomUUID());
  return (
    <Modal title="Konsultasikan desainmu" onClose={onClose}>
      <div className="submit-intro">
        <span>
          <Check size={19} />
        </span>
        <p>
          Desainmu masuk ke tim kami dulu. Setelah itu, lanjut ngobrol lewat WhatsApp untuk
          memastikan detail dan harga final.
        </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const f = new FormData(e.currentTarget);
          try {
            const result = await api<Inquiry>('/inquiries', {
              method: 'POST',
              body: JSON.stringify({
                document,
                customerName: f.get('name'),
                phone: f.get('phone'),
                address: f.get('address'),
                notes: f.get('notes'),
                idempotencyKey: key.current,
              }),
            });
            localStorage.setItem('3dmantap:inquiry:' + result.id, result.accessToken);
            window.location.href = '/inquiry/' + result.id + '?token=' + result.accessToken;
          } catch (err) {
            setError(err);
            setBusy(false);
          }
        }}
      >
        <Field label="Nama kamu">
          <Input name="name" required minLength={2} placeholder="Nama lengkap" />
        </Field>
        <Field label="Nomor WhatsApp">
          <Input name="phone" required placeholder="08xxxxxxxxxx" pattern="[+0-9 ()-]{9,20}" />
        </Field>
        <Field label="Alamat / area proyek">
          <Input name="address" placeholder="Kota, kecamatan, atau alamat pengiriman" />
        </Field>
        <Field label="Ceritakan kebutuhanmu">
          <textarea
            className="input"
            name="notes"
            rows={3}
            placeholder="Detail tambahan, target waktu, atau pertanyaan…"
          />
        </Field>
        <ErrorNotice error={error} />
        <Button disabled={busy} className="full">
          <Send size={16} />
          {busy ? 'Menyimpan pengajuan…' : 'Submit & lanjut konsultasi'}
        </Button>
        <small className="form-footnote">
          Belum ada pembayaran. Produksi dimulai setelah kesepakatan final.
        </small>
      </form>
    </Modal>
  );
}
