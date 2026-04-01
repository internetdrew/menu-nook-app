DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.menus m
      WHERE m.business_id = s.business_id
    )
  ) THEN
    RAISE EXCEPTION 'Cannot migrate subscriptions without at least one menu per business';
  END IF;
END
$$;

ALTER TABLE public.subscriptions
  ADD COLUMN menu_id uuid;

WITH oldest_menus AS (
  SELECT DISTINCT ON (m.business_id)
    m.business_id,
    m.id AS menu_id
  FROM public.menus m
  ORDER BY m.business_id, m.created_at ASC, m.id ASC
)
UPDATE public.subscriptions s
SET menu_id = om.menu_id
FROM oldest_menus om
WHERE s.business_id = om.business_id;

ALTER TABLE public.subscriptions
  ALTER COLUMN menu_id SET NOT NULL;

ALTER TABLE ONLY public.subscriptions
  DROP CONSTRAINT subscriptions_business_id_key;

ALTER TABLE ONLY public.subscriptions
  DROP CONSTRAINT subscriptions_business_id_fkey;

ALTER TABLE ONLY public.subscriptions
  ADD CONSTRAINT subscriptions_menu_id_key UNIQUE (menu_id);

ALTER TABLE ONLY public.subscriptions
  ADD CONSTRAINT subscriptions_menu_id_fkey
    FOREIGN KEY (menu_id) REFERENCES public.menus(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

DROP POLICY "Users can read their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can read their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  menu_id IN (
    SELECT m.id
    FROM public.menus m
    JOIN public.businesses b ON b.id = m.business_id
    WHERE b.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.subscriptions IS 'Subscriptions for each menu, determining if that menu is public (subscribed) or not (unsubscribed).';

ALTER TABLE public.subscriptions
  DROP COLUMN business_id;
