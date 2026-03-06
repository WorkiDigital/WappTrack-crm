import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCount = () => {
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchTotal = useCallback(async () => {
    const { data, error } = await supabase.from('leads').select('unread_count');
    if (!error && data) {
      setTotalUnread(data.reduce((sum, l) => sum + (l.unread_count || 0), 0));
    }
  }, []);

  useEffect(() => {
    fetchTotal();

    const channel = supabase
      .channel('unread-count-global')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
        const next = (payload.new as { unread_count?: number }).unread_count || 0;
        const prev = (payload.old as { unread_count?: number }).unread_count || 0;
        const diff = next - prev;
        if (diff !== 0) setTotalUnread((t) => Math.max(0, t + diff));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const count = (payload.new as { unread_count?: number }).unread_count || 0;
        if (count > 0) setTotalUnread((t) => t + count);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, (payload) => {
        const count = (payload.old as { unread_count?: number }).unread_count || 0;
        if (count > 0) setTotalUnread((t) => Math.max(0, t - count));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTotal]);

  return totalUnread;
};
