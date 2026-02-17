import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import type { Purchase } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface SmsModalProps {
  purchase: Purchase;
  onClose: () => void;
}

const SmsModal = ({ purchase: initialPurchase, onClose }: SmsModalProps) => {
  const purchases = useAppStore((s) => s.purchases);
  const purchase = purchases.find((p) => p.id === initialPurchase.id) || initialPurchase;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (purchase.codigoSms) {
      navigator.clipboard.writeText(purchase.codigoSms);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {purchase.codigoSms ? '✅ SMS Recebido!' : '⏳ Aguardando SMS...'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{purchase.servico} — {purchase.numero}</p>

        <div className={`rounded-xl p-6 mb-6 ${purchase.codigoSms ? 'bg-success/10 border-2 border-success/30' : 'bg-secondary'}`}>
          {purchase.codigoSms ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-accent tracking-widest">
                {purchase.codigoSms}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCopy}
                className="p-2 rounded-lg bg-accent/20 text-accent"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-muted-foreground">Aguardando código...</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          R$ {purchase.preco.toFixed(2)} • {new Date(purchase.timestamp).toLocaleString('pt-BR')}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SmsModal;
