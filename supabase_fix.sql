CREATE TABLE IF NOT EXISTS public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES public.politicians(id),
  platform text,
  content text,
  sentiment text,
  sentiment_score float DEFAULT 0.5,
  is_negative_alert boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS sentiment_score float DEFAULT 0.5;
ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS is_negative_alert boolean DEFAULT false;
NOTIFY pgrst, 'reload schema';
