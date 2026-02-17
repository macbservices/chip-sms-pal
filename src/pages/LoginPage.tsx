import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Lock, User, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isRegister) {
      const { error } = await signUp(email, password, username || email.split('@')[0]);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Conta criada! Verifique seu email para confirmar.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Login realizado!');
        navigate('/dashboard');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-20" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary"
          >
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-gradient">CHIP-SMS</h1>
          <p className="text-muted-foreground mt-2">Números virtuais para receber SMS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 gradient-primary rounded-xl font-semibold text-primary-foreground glow-primary transition-shadow hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <span>Carregando...</span>
            ) : isRegister ? (
              <span className="flex items-center justify-center gap-2"><UserPlus className="w-5 h-5" /> Criar Conta</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> Entrar</span>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Registre-se'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
