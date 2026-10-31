import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { walletApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { endOfMonth, startOfMonth } from '../utils/date';
import BalanceBand from '../components/dashboard/BalanceBand';
import MoveMoney from '../components/dashboard/MoveMoney';
import SpendCalendar from '../components/dashboard/SpendCalendar';
import ActivityList from '../components/dashboard/ActivityList';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState({ sent: 0, received: 0 });
  const [tab, setTab] = useState('send');
  // Bumped after every money movement so balance, calendar and activity all refetch.
  const [version, setVersion] = useState(0);
  const movePanel = useRef(null);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const range = {
      start: startOfMonth(now.getFullYear(), now.getMonth()).toISOString(),
      end: endOfMonth(now.getFullYear(), now.getMonth()).toISOString(),
    };
    Promise.all([walletApi.get(), walletApi.summary(range)])
      .then(([w, s]) => {
        if (!active) return;
        setWallet(w.data.wallet);
        setSummary(s.data);
      })
      .catch((err) => active && toast.error(errorMessage(err, "Couldn't load your balance.")));
    return () => { active = false; };
  }, [version, toast]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const openTab = (id) => {
    setTab(id);
    movePanel.current?.focus(); // moves keyboard focus and scrolls it into view
  };

  return (
    <div className="container dash">
      <BalanceBand name={user.name} wallet={wallet} summary={summary} onSend={() => openTab('send')} onAdd={() => openTab('add')} />

      <div className="dash__grid">
        <section ref={movePanel} tabIndex={-1} className="panel move" aria-label="Move money">
          <MoveMoney tab={tab} onTabChange={setTab} balance={wallet?.balance} onDone={refresh} />
        </section>
        <section className="panel" aria-label="Spending calendar">
          <SpendCalendar version={version} />
        </section>
      </div>

      <ActivityList version={version} />
    </div>
  );
}
