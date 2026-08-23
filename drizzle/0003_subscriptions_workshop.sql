-- Faza 2: abonamentul e legat de un atelier, cu prețul copiat la creare.
-- ALTER TABLE RENAME/ADD -- nu se șterge nimic.

ALTER TABLE public.subscriptions
  ADD COLUMN workshop_id uuid REFERENCES public.workshops(id),
  ADD COLUMN price_per_session numeric(10, 2);

-- Abonamentele existente (dinainte de Faza 2) nu aveau atelier explicit.
-- Le mutăm la atelierul principal al copilului, dacă are unul; dacă nu,
-- rămân null -- nu blochează nimic, doar nu apar legate de un atelier
-- anume pe fișa financiară.
UPDATE public.subscriptions s
SET workshop_id = cw.workshop_id
FROM public.child_workshops cw
WHERE cw.child_id = s.child_id AND cw.is_primary = true AND s.workshop_id IS NULL;

-- price_per_session: fără informație istorică despre prețul real din acel
-- moment, o aproximăm din prețul curent al atelierului; unde nu se poate
-- (fără atelier), din price / total_credits.
UPDATE public.subscriptions s
SET price_per_session = w.price_per_session
FROM public.workshops w
WHERE w.id = s.workshop_id AND s.price_per_session IS NULL;

UPDATE public.subscriptions
SET price_per_session = round(price / NULLIF(total_credits, 0), 2)
WHERE price_per_session IS NULL AND total_credits IS NOT NULL AND total_credits > 0;

UPDATE public.subscriptions SET price_per_session = 0 WHERE price_per_session IS NULL;

ALTER TABLE public.subscriptions ALTER COLUMN price_per_session SET NOT NULL;

--> statement-breakpoint

ALTER TABLE public.subscriptions RENAME COLUMN total_credits TO total_sessions;
ALTER TABLE public.subscriptions ALTER COLUMN total_sessions TYPE integer USING round(total_sessions)::integer;
