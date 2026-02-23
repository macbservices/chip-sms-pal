
-- Locations table (each location = a chipeira with an API key)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_locations_api_key ON public.locations(api_key);

CREATE POLICY "Users can view own locations" ON public.locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON public.locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON public.locations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all locations" ON public.locations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Modems table
CREATE TABLE public.modems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  port_name TEXT NOT NULL,
  imei TEXT,
  operator TEXT,
  signal_strength INTEGER,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.modems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modems" ON public.modems FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.locations WHERE locations.id = modems.location_id AND locations.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all modems" ON public.modems FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_modems_updated_at BEFORE UPDATE ON public.modems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Chips table (real phone numbers from the chipeira)
CREATE TABLE public.chips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modem_id UUID NOT NULL REFERENCES public.modems(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  iccid TEXT,
  operator TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chips" ON public.chips FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.modems 
    JOIN public.locations ON locations.id = modems.location_id 
    WHERE modems.id = chips.modem_id AND locations.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all chips" ON public.chips FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_chips_updated_at BEFORE UPDATE ON public.chips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
