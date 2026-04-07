
-- Menu categories enum
CREATE TYPE public.menu_category AS ENUM ('prato', 'bebida', 'sobremesa', 'entrada', 'acompanhamento');

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category menu_category NOT NULL DEFAULT 'prato',
  ingredients TEXT,
  allergens TEXT[] DEFAULT '{}',
  image_url TEXT,
  image_alt TEXT,
  audio_text TEXT,
  libras_video_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Waiter calls table
CREATE TABLE public.waiter_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Menu items: anyone can read, no auth needed for MVP
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Anyone can manage menu items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);

-- Waiter calls: anyone can create (customers), anyone can read/update (admin)
CREATE POLICY "Anyone can create waiter calls" ON public.waiter_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view waiter calls" ON public.waiter_calls FOR SELECT USING (true);
CREATE POLICY "Anyone can update waiter calls" ON public.waiter_calls FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete waiter calls" ON public.waiter_calls FOR DELETE USING (true);

-- Enable realtime for waiter_calls
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
