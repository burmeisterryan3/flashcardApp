// Shows a parent-uploaded photo stored in IndexedDB (CC-03).
import { useEffect, useState } from 'react';
import { db } from '../../db/db';

export function MediaImage({ id, alt = 'Picture for this card' }: { id: string; alt?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined;
    db.media.get(id).then((m) => {
      if (m) {
        u = URL.createObjectURL(m.blob);
        setUrl(u);
      }
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  if (!url) return null;
  return <img src={url} alt={alt} style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 12 }} />;
}
