import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Users, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface AdminUser {
  id: string;
  email: string;
  username: string;
  saldo: number;
  roles: string[];
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<'services' | 'users'>('services');
  const [services, setServices] = useState<DbService[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingService, setEditingService] = useState<Partial<DbService> | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', username: '' });
  const [showNewUser, setShowNewUser] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; saldo: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/dashboard');
  }, [user, isAdmin, loading]);

  useEffect(() => {
    fetchServices();
    fetchUsers();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at');
    if (data) setServices(data as DbService[]);
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke('admin-users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: undefined,
      });
      // The function needs query params, let's use fetch directly
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSaveService = async () => {
    if (!editingService) return;
    if (isCreatingService) {
      const { error } = await supabase.from('services').insert({
        name: editingService.name || '',
        slug: editingService.slug || editingService.name?.toLowerCase().replace(/\s+/g, '-') || '',
        preco: editingService.preco || 0,
        duracao: editingService.duracao || '1 SMS',
        permanente: editingService.permanente || false,
        icon: editingService.icon || 'smartphone',
        ativo: editingService.ativo !== false,
      });
      if (error) toast.error(error.message);
      else toast.success('Serviço criado!');
    } else {
      const { error } = await supabase.from('services')
        .update({
          name: editingService.name,
          preco: editingService.preco,
          duracao: editingService.duracao,
          permanente: editingService.permanente,
          icon: editingService.icon,
          ativo: editingService.ativo,
        })
        .eq('id', editingService.id!);
      if (error) toast.error(error.message);
      else toast.success('Serviço atualizado!');
    }
    setEditingService(null);
    setIsCreatingService(false);
    fetchServices();
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Serviço excluído!'); fetchServices(); }
  };

  const handleCreateUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Usuário criado!');
        setNewUser({ email: '', password: '', username: '' });
        setShowNewUser(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Erro ao criar');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Excluir este usuário?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) { toast.success('Usuário excluído!'); fetchUsers(); }
      else toast.error(data.error);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          username: editingUser.username,
          saldo: parseFloat(editingUser.saldo),
        }),
      });
      const data = await res.json();
      if (data.ok) { toast.success('Usuário atualizado!'); setEditingUser(null); fetchUsers(); }
      else toast.error(data.error);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient">Painel Admin</h1>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-secondary rounded-xl px-4 py-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setTab('services')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${tab === 'services' ? 'gradient-primary text-primary-foreground glow-primary' : 'glass-card text-muted-foreground'}`}>
            <Package className="w-4 h-4" /> Serviços
          </button>
          <button onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${tab === 'users' ? 'gradient-primary text-primary-foreground glow-primary' : 'glass-card text-muted-foreground'}`}>
            <Users className="w-4 h-4" /> Usuários
          </button>
        </div>

        {/* SERVICES TAB */}
        {tab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-display font-semibold">Serviços ({services.length})</h2>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setEditingService({}); setIsCreatingService(true); }}
                className="gradient-success text-success-foreground rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Novo Serviço
              </motion.button>
            </div>

            {/* Edit/Create form */}
            {editingService && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4">{isCreatingService ? 'Novo Serviço' : 'Editar Serviço'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Nome" value={editingService.name || ''} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Preço" type="number" step="0.01" value={editingService.preco || ''} onChange={(e) => setEditingService({ ...editingService, preco: parseFloat(e.target.value) })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Duração (ex: 1 SMS, 30 dias)" value={editingService.duracao || ''} onChange={(e) => setEditingService({ ...editingService, duracao: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Ícone (google, whatsapp...)" value={editingService.icon || ''} onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingService.permanente || false} onChange={(e) => setEditingService({ ...editingService, permanente: e.target.checked })} />
                    Permanente
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingService.ativo !== false} onChange={(e) => setEditingService({ ...editingService, ativo: e.target.checked })} />
                    Ativo
                  </label>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSaveService} className="gradient-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button onClick={() => { setEditingService(null); setIsCreatingService(false); }}
                    className="bg-secondary text-muted-foreground rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.ativo ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {s.permanente && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Permanente</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">R$ {Number(s.preco).toFixed(2)} — {s.duracao}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingService(s); setIsCreatingService(false); }}
                      className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteService(s.id)}
                      className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-display font-semibold">Usuários ({users.length})</h2>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewUser(!showNewUser)}
                className="gradient-success text-success-foreground rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Novo Usuário
              </motion.button>
            </div>

            {showNewUser && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4">Novo Usuário</h3>
                <div className="grid grid-cols-3 gap-4">
                  <input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Senha" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCreateUser} className="gradient-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Save className="w-4 h-4" /> Criar
                  </button>
                  <button onClick={() => setShowNewUser(false)} className="bg-secondary text-muted-foreground rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            {editingUser && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4">Editar Usuário</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Username" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                  <input placeholder="Saldo" type="number" step="0.01" value={editingUser.saldo} onChange={(e) => setEditingUser({ ...editingUser, saldo: e.target.value })}
                    className="px-3 py-2 bg-secondary rounded-lg border border-border text-foreground outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleUpdateUser} className="gradient-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                  <button onClick={() => setEditingUser(null)} className="bg-secondary text-muted-foreground rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{u.username}</span>
                      {u.roles.includes('admin') && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Admin</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <p className="text-xs text-accent">Saldo: R$ {Number(u.saldo).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingUser({ id: u.id, username: u.username, saldo: String(u.saldo) })}
                      className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"><Pencil className="w-4 h-4" /></button>
                    {!u.roles.includes('admin') && (
                      <button onClick={() => handleDeleteUser(u.id)}
                        className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
