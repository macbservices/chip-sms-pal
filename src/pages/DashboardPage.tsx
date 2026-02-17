import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, LogOut, History, Wallet, CreditCard } from 'lucide-react';
import { useAppStore, SERVICES, DEMO_NUMBERS, type Service, type PhoneNumber } from '@/lib/store';
import ServiceCard from '@/components/ServiceCard';
import NumberCard from '@/components/NumberCard';
import SmsModal from '@/components/SmsModal';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, buy, purchases } = useAppStore();
  const [selectedService, setSelectedService] = useState<Service>(SERVICES[0]);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleBuy = (num: PhoneNumber) => {
    const purchase = buy(num, selectedService);
    if (purchase) {
      setActivePurchaseId(purchase.id);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activePurchase = purchases.find((p) => p.id === activePurchaseId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-gradient">CHIP-SMS</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-accent" />
              <span className="font-semibold text-accent">R$ {user.saldo.toFixed(2)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/pix')}
              className="gradient-success rounded-xl px-4 py-2 text-sm font-semibold text-success-foreground flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> PIX
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/historico')}
              className="bg-secondary rounded-xl px-4 py-2 text-sm font-medium text-secondary-foreground flex items-center gap-2"
            >
              <History className="w-4 h-4" /> Histórico
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-destructive/20 text-destructive rounded-xl p-2"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Services */}
        <section className="mb-8">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Selecione o Serviço</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SERVICES.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                selected={selectedService.id === s.id}
                onClick={() => setSelectedService(s)}
              />
            ))}
          </div>
        </section>

        {/* Numbers */}
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">
            Números Disponíveis — {selectedService.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_NUMBERS.map((num) => (
              <NumberCard
                key={num.port}
                number={num}
                service={selectedService}
                onBuy={() => handleBuy(num)}
                disabled={user.saldo < selectedService.preco}
              />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {activePurchase && (
          <SmsModal
            purchase={activePurchase}
            onClose={() => setActivePurchaseId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
