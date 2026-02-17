import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, LogOut, History, Wallet, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ServiceCard from '@/components/ServiceCard';
import NumberCard from '@/components/NumberCard';
import SmsModal from '@/components/SmsModal';
import type { Purchase } from '@/lib/store';
import { DEMO_NUMBERS } from '@/lib/store';

interface DbService {
  id: string;
  name: string;
  slug: string;
  preco: number;
  duracao: string;
  permanente: boolean;
  icon: string;
  ativo: boolean;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, refreshProfile, loading } = useAuth();
  const [services, setServices] = useState<DbService[]>([]);
  const [selectedService, setSelectedService] = useState<DbService | null>(null);
  const [activePurchase, setActivePurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('ativo', true)
        .order('preco');
      if (data) {
        setServices(data as DbService[]);
        if (data.length > 0 && !selectedService) setSelectedService(data[0] as DbService);
      }
    };
    fetchServices();
  }, []);

  const handleBuy = async (num: typeof DEMO_NUMBERS[0]) => {
    if (!user || !profile || !selectedService) return;
    if (profile.saldo < selectedService.preco) return;

    // Deduct saldo
    const newSaldo = profile.saldo - selectedService.preco;
    await supabase.from('profiles').update({ saldo: newSaldo }).eq('id', user.id);

    // Create purchase
    const { data: purchaseData } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        service_id: selectedService.id,
        numero: num.number,
        preco: selectedService.preco,
        port: num.port,
        demo: !!num.demo,
      })
      .select()
      .single();

    await refreshProfile();

    if (purchaseData) {
      const purchase: Purchase = {
        id: purchaseData.id,
        numero: purchaseData.numero,
        servico: selectedService.name,
        preco: Number(purchaseData.preco),
        codigoSms: null,
        usado: false,
        timestamp: purchaseData.created_at,
        demo: purchaseData.demo,
      };
      setActivePurchase(purchase);

      // Simulate SMS after delay
      setTimeout(async () => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await supabase
          .from('purchases')
          .update({ codigo_sms: code, usado: true })
          .eq('id', purchaseData.id);
        setActivePurchase((prev) =>
          prev && prev.id === purchaseData.id
            ? { ...prev, codigoSms: code, usado: true }
            : prev
        );
      }, 5000 + Math.random() * 10000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || !user || !profile) return null;

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-gradient">CHIP-SMS</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-accent" />
              <span className="font-semibold text-accent">R$ {profile.saldo.toFixed(2)}</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/pix')}
              className="gradient-success rounded-xl px-4 py-2 text-sm font-semibold text-success-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> PIX
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/historico')}
              className="bg-secondary rounded-xl px-4 py-2 text-sm font-medium text-secondary-foreground flex items-center gap-2">
              <History className="w-4 h-4" /> Histórico
            </motion.button>
            {isAdmin && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="bg-primary/20 text-primary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" /> Admin
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-destructive/20 text-destructive rounded-xl p-2">
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Selecione o Serviço</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={{ id: s.slug, name: s.name, preco: s.preco, duracao: s.duracao, permanente: s.permanente, icon: s.icon }}
                selected={selectedService?.id === s.id}
                onClick={() => setSelectedService(s)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Números Disponíveis {selectedService && `— ${selectedService.name}`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_NUMBERS.map((num) => (
              <NumberCard
                key={num.port}
                number={num}
                service={selectedService ? { id: selectedService.slug, name: selectedService.name, preco: selectedService.preco, duracao: selectedService.duracao, permanente: selectedService.permanente, icon: selectedService.icon } : { id: '', name: '', preco: 0, duracao: '', permanente: false, icon: '' }}
                onBuy={() => handleBuy(num)}
                disabled={!selectedService || profile.saldo < (selectedService?.preco || 0)}
              />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {activePurchase && (
          <SmsModal purchase={activePurchase} onClose={() => setActivePurchase(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
