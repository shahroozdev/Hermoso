import { useRef, useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

export const useConfirmAction = () => {
  const [pending, setPending] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const busy = useRef(false);
  const ask = (title: string, message: string, action: () => Promise<void>) => setPending({ title, message, action });
  const modal = pending && <ConfirmModal title={pending.title} message={pending.message}
    onCancel={() => { if (!busy.current) setPending(null); }}
    onConfirm={async () => {
      if (busy.current) return;
      busy.current = true;
      try { await pending.action(); } finally { busy.current = false; setPending(null); }
    }} />;
  return { ask, modal };
};
