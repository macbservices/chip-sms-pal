import { create } from 'zustand';

export interface Service {
  id: string;
  name: string;
  preco: number;
  duracao: string;
  permanente: boolean;
  icon: string;
}

export interface PhoneNumber {
  port: string;
  number: string;
  real: boolean;
  label: string;
  demo?: boolean;
}

export interface Purchase {
  id: string;
  numero: string;
  servico: string;
  preco: number;
  codigoSms: string | null;
  usado: boolean;
  timestamp: string;
  demo: boolean;
}

interface AppState {
  user: { username: string; saldo: number } | null;
  purchases: Purchase[];
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  addSaldo: (valor: number) => void;
  buy: (number: PhoneNumber, servico: Service) => Purchase | null;
}

const SERVICES: Service[] = [
  { id: 'gmail', name: 'Gmail', preco: 1.30, duracao: '1 SMS', permanente: false, icon: 'google' },
  { id: 'whatsapp', name: 'WhatsApp', preco: 15.46, duracao: '30 dias', permanente: true, icon: 'whatsapp' },
  { id: 'telegram', name: 'Telegram', preco: 2.50, duracao: '1 SMS', permanente: false, icon: 'telegram' },
  { id: 'facebook', name: 'Facebook', preco: 3.20, duracao: '1 SMS', permanente: false, icon: 'facebook' },
  { id: 'outros', name: 'Outros', preco: 1.00, duracao: '1 SMS', permanente: false, icon: 'smartphone' },
];

const DEMO_NUMBERS: PhoneNumber[] = [
  { port: 'demo_0', number: '+5511999123456', real: false, label: 'DEMO', demo: true },
  { port: 'demo_1', number: '+5521988654321', real: false, label: 'DEMO', demo: true },
  { port: 'demo_2', number: '+5531977987654', real: false, label: 'DEMO', demo: true },
  { port: 'demo_3', number: '+5541966321789', real: false, label: 'DEMO', demo: true },
  { port: 'demo_4', number: '+5551955789456', real: false, label: 'DEMO', demo: true },
  { port: 'demo_5', number: '+5561944654123', real: false, label: 'DEMO', demo: true },
];

const USERS: Record<string, { password: string; saldo: number }> = {
  admin: { password: '123', saldo: 100 },
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  purchases: [],

  login: (username, password) => {
    const u = USERS[username];
    if (u && u.password === password) {
      set({ user: { username, saldo: u.saldo } });
      return true;
    }
    return false;
  },

  register: (username, password) => {
    if (USERS[username]) return false;
    USERS[username] = { password, saldo: 50 };
    set({ user: { username, saldo: 50 } });
    return true;
  },

  logout: () => set({ user: null }),

  addSaldo: (valor) => {
    const { user } = get();
    if (!user) return;
    const newSaldo = user.saldo + valor;
    USERS[user.username].saldo = newSaldo;
    set({ user: { ...user, saldo: newSaldo } });
  },

  buy: (num, servico) => {
    const { user, purchases } = get();
    if (!user || user.saldo < servico.preco) return null;
    const newSaldo = user.saldo - servico.preco;
    USERS[user.username].saldo = newSaldo;

    const purchase: Purchase = {
      id: Date.now().toString(),
      numero: num.number,
      servico: servico.name,
      preco: servico.preco,
      codigoSms: null,
      usado: false,
      timestamp: new Date().toISOString(),
      demo: !!num.demo,
    };

    // Simulate SMS arriving after 5-15 seconds
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      set((state) => ({
        purchases: state.purchases.map((p) =>
          p.id === purchase.id ? { ...p, codigoSms: code, usado: true } : p
        ),
      }));
    }, 5000 + Math.random() * 10000);

    set({
      user: { ...user, saldo: newSaldo },
      purchases: [purchase, ...purchases],
    });
    return purchase;
  },
}));

export { SERVICES, DEMO_NUMBERS };
