-- Add translation cache columns
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS ingredients_en text,
  ADD COLUMN IF NOT EXISTS audio_text_en text,
  ADD COLUMN IF NOT EXISTS name_es text,
  ADD COLUMN IF NOT EXISTS description_es text,
  ADD COLUMN IF NOT EXISTS ingredients_es text,
  ADD COLUMN IF NOT EXISTS audio_text_es text,
  ADD COLUMN IF NOT EXISTS name_fr text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS ingredients_fr text,
  ADD COLUMN IF NOT EXISTS audio_text_fr text,
  ADD COLUMN IF NOT EXISTS needs_translation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_translating boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS translated_at timestamptz;

-- Trigger to invalidate cached translations when source PT content changes
CREATE OR REPLACE FUNCTION public.invalidate_menu_translations()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.needs_translation := true;
    NEW.is_translating := false;
    RETURN NEW;
  END IF;

  IF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.ingredients IS DISTINCT FROM OLD.ingredients THEN
    NEW.name_en := NULL; NEW.description_en := NULL; NEW.ingredients_en := NULL; NEW.audio_text_en := NULL;
    NEW.name_es := NULL; NEW.description_es := NULL; NEW.ingredients_es := NULL; NEW.audio_text_es := NULL;
    NEW.name_fr := NULL; NEW.description_fr := NULL; NEW.ingredients_fr := NULL; NEW.audio_text_fr := NULL;
    NEW.needs_translation := true;
    NEW.is_translating := false;
    NEW.translated_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_menu_translations ON public.menu_items;
CREATE TRIGGER trg_invalidate_menu_translations
BEFORE INSERT OR UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_menu_translations();