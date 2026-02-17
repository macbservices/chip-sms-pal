import { motion } from 'framer-motion';
import { Mail, MessageCircle, Send, Facebook, Smartphone } from 'lucide-react';
import type { Service } from '@/lib/store';

const iconMap: Record<string, React.ReactNode> = {
  google: <Mail className="w-6 h-6" />,
  whatsapp: <MessageCircle className="w-6 h-6" />,
  telegram: <Send className="w-6 h-6" />,
  facebook: <Facebook className="w-6 h-6" />,
  smartphone: <Smartphone className="w-6 h-6" />,
};

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onClick: () => void;
}

const ServiceCard = ({ service, selected, onClick }: ServiceCardProps) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`rounded-xl p-4 text-center transition-all ${
      selected
        ? 'gradient-primary glow-primary text-primary-foreground'
        : 'glass-card text-foreground hover:border-primary/50'
    }`}
  >
    <div className="flex justify-center mb-2">{iconMap[service.icon]}</div>
    <p className="font-semibold text-sm">{service.name}</p>
    <p className={`text-xs mt-1 ${selected ? 'text-primary-foreground/80' : 'text-accent'} font-bold`}>
      R$ {service.preco.toFixed(2)}
    </p>
    <p className={`text-xs ${selected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
      {service.duracao}
    </p>
  </motion.button>
);

export default ServiceCard;
