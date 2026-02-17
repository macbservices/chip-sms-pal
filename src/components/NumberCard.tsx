import { motion } from 'framer-motion';
import { Phone, ShoppingCart } from 'lucide-react';
import type { PhoneNumber, Service } from '@/lib/store';

interface NumberCardProps {
  number: PhoneNumber;
  service: Service;
  onBuy: () => void;
  disabled: boolean;
}

const NumberCard = ({ number, service, onBuy, disabled }: NumberCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card rounded-xl p-5 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-mono font-semibold text-foreground">{number.number}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${number.demo ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
            {number.label}
          </span>
        </div>
      </div>
    </div>

    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onBuy}
      disabled={disabled}
      className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
        disabled
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'gradient-primary text-primary-foreground glow-primary'
      }`}
    >
      <ShoppingCart className="w-4 h-4" />
      Comprar {service.name} — R$ {service.preco.toFixed(2)}
    </motion.button>
  </motion.div>
);

export default NumberCard;
