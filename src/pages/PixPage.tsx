import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Copy, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const PIX_KEY = 'PIX-CHIP-SMS@GMAIL.COM';

const PixPage = () => {
  const navigate = useNavigate();
  const { user, addSaldo } = useAppStore();
  const [valor, setValor] = useState('');
  const [copied, setCopied] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success('Chave PIX copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (v >= 5 && v <= 1000) {
      addSaldo(v);
      toast.success(`Saldo adicionado! +R$ ${v.toFixed(2)}`);
      navigate('/dashboard');
    } else {
      toast.error('Valor deve ser entre R$ 5,00 e R$ 1.000,00');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, hsl(155 75% 45%), hsl(165 80% 50%))' }} />
      <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 gradient-success rounded-2xl flex items-center justify-center mx-auto mb-4 glow-success">
            <CreditCard className="w-8 h-8 text-success-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">PIX Recarga</h1>
          <p className="text-muted-foreground text-sm mt-1">Recarga instantânea via PIX</p>
        </div>

        {/* PIX Key */}
        <div className="bg-secondary rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Chave PIX</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-accent font-semibold">{PIX_KEY}</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">💰 Valor da Recarga (R$)</label>
            <input
              type="number"
              step="0.01"
              min="5"
              max="1000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="10.00"
              required
              className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-foreground text-center text-lg font-semibold placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">Mínimo R$ 5,00 — Máximo R$ 1.000,00</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 gradient-success rounded-xl font-semibold text-success-foreground glow-success"
          >
            Confirmar Recarga
          </motion.button>
        </form>

        <div className="mt-6 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-xs text-warning text-center">
            ⚠️ Envie o PIX e depois confirme o valor aqui. A recarga é processada automaticamente.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PixPage;
