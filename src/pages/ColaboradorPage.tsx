import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, ArrowLeft, Plus, Copy, Trash2, Wifi, WifiOff, Radio, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

interface Modem {
  id: string;
  port_name: string;
  imei: string | null;
  operator: string | null;
  signal_strength: number | null;
  status: string;
  last_seen_at: string | null;
  chips: Chip[];
}

interface Chip {
  id: string;
  phone_number: string;
  iccid: string | null;
  operator: string | null;
  status: string;
}

const ColaboradorPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modems, setModems] = useState<Modem[]>([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchLocations();
  }, [user]);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLocations(data as Location[]);
  };

  const fetchModems = async (locationId: string) => {
    const { data: modemsData } = await supabase
      .from('modems')
      .select('*')
      .eq('location_id', locationId)
      .order('port_name');

    if (modemsData) {
      const modemsWithChips: Modem[] = [];
      for (const modem of modemsData) {
        const { data: chipsData } = await supabase
          .from('chips')
          .select('*')
          .eq('modem_id', modem.id);
        modemsWithChips.push({
          ...modem,
          chips: (chipsData || []) as Chip[],
        } as Modem);
      }
      setModems(modemsWithChips);
    }
  };

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    fetchModems(loc.id);
  };

  const handleCreateLocation = async () => {
    if (!user || !newLocationName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('locations')
      .insert({ user_id: user.id, name: newLocationName.trim() })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else if (data) {
      toast({ title: 'Localização criada!', description: 'API Key gerada com sucesso.' });
      setNewLocationName('');
      await fetchLocations();
      setShowApiKey(data.id);
    }
    setCreating(false);
  };

  const handleDeleteLocation = async (id: string) => {
    await supabase.from('locations').delete().eq('id', id);
    if (selectedLocation?.id === id) {
      setSelectedLocation(null);
      setModems([]);
    }
    fetchLocations();
    toast({ title: 'Localização removida' });
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copiado!', description: 'API Key copiada para a área de transferência.' });
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 120000; // 2 min
  };

  const apiUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/gsm-gateway`;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <header className="glass-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="bg-secondary rounded-xl p-2 text-secondary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-gradient">Colaborador — Chipeira</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Create new location */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Nova Localização</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Ex: Escritório Principal"
              className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none"
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleCreateLocation}
              disabled={creating || !newLocationName.trim()}
              className="gradient-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Criar
            </motion.button>
          </div>
        </section>

        {/* Locations list */}
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Suas Localizações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <motion.div key={loc.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-xl p-5 cursor-pointer transition-all ${
                  selectedLocation?.id === loc.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectLocation(loc)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isOnline(loc.last_seen_at) ? (
                      <Wifi className="w-5 h-5 text-success" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{loc.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isOnline(loc.last_seen_at) ? 'Online' : loc.last_seen_at ? 'Offline' : 'Nunca conectou'}
                      </p>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}
                    className="text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* API Key */}
                <div className="bg-secondary/50 rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium">API Key</span>
                    <div className="flex gap-1">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setShowApiKey(showApiKey === loc.id ? null : loc.id); }}
                        className="text-xs text-primary underline">
                        {showApiKey === loc.id ? 'Ocultar' : 'Mostrar'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); copyApiKey(loc.api_key); }}
                        className="text-primary p-0.5">
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-foreground break-all">
                    {showApiKey === loc.id ? loc.api_key : '••••••••••••••••••••••••••••••••'}
                  </p>
                </div>
              </motion.div>
            ))}
            {locations.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhuma localização criada. Crie uma acima para gerar sua API Key.
              </p>
            )}
          </div>
        </section>

        {/* Connection info */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Configuração do app.exe</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">API URL:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-secondary rounded-lg px-3 py-1.5 text-accent font-mono text-xs break-all flex-1">{apiUrl}</code>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { navigator.clipboard.writeText(apiUrl); toast({ title: 'URL copiada!' }); }}
                  className="text-primary"><Copy className="w-4 h-4" /></motion.button>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Anon Key:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-secondary rounded-lg px-3 py-1.5 text-accent font-mono text-xs break-all flex-1">{anonKey}</code>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { navigator.clipboard.writeText(anonKey); toast({ title: 'Key copiada!' }); }}
                  className="text-primary"><Copy className="w-4 h-4" /></motion.button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Atualize estas informações no seu <code>app_gsm.py</code> antes de compilar o .exe.
            </p>
          </div>
        </section>

        {/* Modems for selected location */}
        {selectedLocation && (
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">
              Modems — {selectedLocation.name}
            </h2>
            {modems.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum modem detectado ainda.</p>
                <p className="text-xs mt-1">Execute o app.exe na sua chipeira para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modems.map((modem) => (
                  <motion.div key={modem.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isOnline(modem.last_seen_at) ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        <span className="font-mono text-sm font-semibold text-foreground">{modem.port_name}</span>
                      </div>
                      {modem.signal_strength != null && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded-lg text-muted-foreground">
                          Sinal: {modem.signal_strength}
                        </span>
                      )}
                    </div>
                    {modem.imei && <p className="text-xs text-muted-foreground">IMEI: {modem.imei}</p>}
                    {modem.operator && <p className="text-xs text-muted-foreground">Op: {modem.operator}</p>}

                    {modem.chips.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {modem.chips.map((chip) => (
                          <div key={chip.id} className="bg-secondary/50 rounded-lg p-2 flex items-center gap-2">
                            {chip.status === 'active' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-mono text-xs text-foreground">{chip.phone_number}</p>
                              {chip.operator && <p className="text-[10px] text-muted-foreground">{chip.operator}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ColaboradorPage;
