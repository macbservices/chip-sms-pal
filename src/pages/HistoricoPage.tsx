import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PurchaseRow {
  id: string;
  numero: string;
  preco: number;
  codigo_sms: string | null;
  usado: boolean;
  created_at: string;
  services: { name: string } | null;
}

const HistoricoPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('purchases')
        .select('*, services(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setPurchases(data as unknown as PurchaseRow[]);
    };
    fetch();
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient">Histórico</h1>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-secondary rounded-xl px-4 py-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-6">Total: {purchases.length} compras</p>

        {purchases.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma compra realizada ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.usado ? 'bg-success/20' : 'bg-warning/20'}`}>
                    {p.usado ? <CheckCircle className="w-5 h-5 text-success" /> : <Clock className="w-5 h-5 text-warning animate-pulse-glow" />}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{p.services?.name || 'Serviço'}</p>
                    <p className="text-sm text-muted-foreground">{p.numero}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">R$ {Number(p.preco).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  {p.codigo_sms && <p className="text-sm font-mono text-accent font-bold mt-1">{p.codigo_sms}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoricoPage;
