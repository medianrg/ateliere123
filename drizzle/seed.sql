-- Date de test: 3 ateliere (2 săptămânale, 1 lunar), 10 copii (unul înscris
-- la două ateliere), ședințe pe ~2 luni (trecut + viitor, nebifate, ca să
-- vezi alertele roșii din calendar), 3 abonamente (câte unul din fiecare
-- culoare) și 2 plăți.
-- Rulează în Supabase Studio -> SQL Editor, DUPĂ ce ai aplicat toate
-- migrările din drizzle/ în ordine (0000 -> 0003) și DUPĂ ce ți-ai creat
-- contul de administrator (secțiunea din README).
-- Sigur de rulat de mai multe ori (id-uri fixe, ON CONFLICT DO NOTHING).

-- session_types --------------------------------------------------------
insert into public.session_types (id, name, suggested_sessions_used, counts_in_stats, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'Obișnuit', 1, true, true),
  ('10000000-0000-0000-0000-000000000002', 'Special', 0, false, true)
on conflict (id) do nothing;

-- workshops (ateliere) ------------------------------------------------------
insert into public.workshops (
  id, name, min_age, max_age, price_per_session, drop_in_price, color,
  frequency, weekday, start_time, duration_min, month_week, sessions_per_month, sort_order
) values
  ('60000000-0000-0000-0000-000000000001', 'Atelier 10-12 Marți', 10, 12, 60, 80, '#60a5fa',
    'weekly', 2, '17:00', 120, null, null, 1),
  ('60000000-0000-0000-0000-000000000002', 'Atelier 10-12 Joi', 10, 12, 60, 80, '#34d399',
    'weekly', 4, '17:00', 120, null, null, 2),
  ('60000000-0000-0000-0000-000000000003', 'Atelier 14-18', 14, 18, 150, 220, '#f472b6',
    'monthly', 6, '10:00', 360, 3, 1, 3)
on conflict (id) do nothing;

-- children (aceiași ca înainte, dacă existau deja) --------------------------
insert into public.children (id, first_name, last_name, birth_date, payment_status) values
  ('30000000-0000-0000-0000-000000000001', 'Maria', 'Popescu', '2017-03-12', 'standard'),
  ('30000000-0000-0000-0000-000000000002', 'Andrei', 'Ionescu', '2016-07-04', 'standard'),
  ('30000000-0000-0000-0000-000000000003', 'Ioana', 'Radu', '2016-11-20', 'partial'),
  ('30000000-0000-0000-0000-000000000004', 'Matei', 'Dumitru', '2015-01-09', 'standard'),
  ('30000000-0000-0000-0000-000000000005', 'Elena', 'Stan', '2014-09-17', 'standard'),
  ('30000000-0000-0000-0000-000000000006', 'David', 'Constantin', '2014-05-23', 'exempt'),
  ('30000000-0000-0000-0000-000000000007', 'Sofia', 'Gheorghe', '2013-12-02', 'standard'),
  ('30000000-0000-0000-0000-000000000008', 'Vlad', 'Marin', '2011-06-14', 'standard'),
  ('30000000-0000-0000-0000-000000000009', 'Ana', 'Barbu', '2010-08-30', 'partial'),
  ('30000000-0000-0000-0000-00000000000a', 'Tudor', 'Florea', '2010-02-19', 'standard')
on conflict (id) do nothing;

-- consents (variate ca să se vadă toate cele trei culori) ------------------
insert into public.consents (child_id, photo_status, tag_parent_social) values
  ('30000000-0000-0000-0000-000000000001', 'full', true),
  ('30000000-0000-0000-0000-000000000002', 'full', false),
  ('30000000-0000-0000-0000-000000000003', 'masked', false),
  ('30000000-0000-0000-0000-000000000004', 'full', true),
  ('30000000-0000-0000-0000-000000000005', 'none', false),
  ('30000000-0000-0000-0000-000000000006', 'masked', false),
  ('30000000-0000-0000-0000-000000000007', 'full', true),
  ('30000000-0000-0000-0000-000000000008', 'full', false),
  ('30000000-0000-0000-0000-000000000009', 'none', false),
  ('30000000-0000-0000-0000-00000000000a', 'masked', true)
on conflict (child_id) do nothing;

-- child_workshops: cine e la ce atelier (Matei e la ambele ateliere de 10-12,
-- ca să se vadă many-to-many-ul) -------------------------------------------
insert into public.child_workshops (child_id, workshop_id, is_primary, joined_at) values
  ('30000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', false, current_date - 30),
  ('30000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000002', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000002', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000003', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000003', true, current_date - 60),
  ('30000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000003', true, current_date - 60),
  ('30000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000003', true, current_date - 60)
on conflict (child_id, workshop_id) do nothing;

-- sessions: ședințele săptămânale (Marți/Joi) pe ~2 luni, trecut + viitor --
insert into public.sessions (session_type_id, workshop_id, date, start_time, end_time, sessions_used_default, status)
select '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
       d::date, '17:00', '19:00', 1, 'scheduled'
from generate_series(current_date - interval '42 days', current_date + interval '14 days', interval '1 day') as d
where extract(isodow from d) = 2
  and not exists (
    select 1 from public.sessions s
    where s.workshop_id = '60000000-0000-0000-0000-000000000001' and s.date = d::date
  );

insert into public.sessions (session_type_id, workshop_id, date, start_time, end_time, sessions_used_default, status)
select '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002',
       d::date, '17:00', '19:00', 1, 'scheduled'
from generate_series(current_date - interval '42 days', current_date + interval '14 days', interval '1 day') as d
where extract(isodow from d) = 4
  and not exists (
    select 1 from public.sessions s
    where s.workshop_id = '60000000-0000-0000-0000-000000000002' and s.date = d::date
  );

-- sessions: ședința lunară (14-18), a 3-a sâmbătă din lună, 3 luni la rând --
with months as (
  select date_trunc('month', current_date - interval '1 month')::date as m
  union all select date_trunc('month', current_date)::date
  union all select date_trunc('month', current_date + interval '1 month')::date
),
saturdays as (
  select m, gs::date as d, row_number() over (partition by m order by gs) as rn
  from months, generate_series(m, m + interval '1 month' - interval '1 day', interval '1 day') as gs
  where extract(isodow from gs) = 6
)
insert into public.sessions (session_type_id, workshop_id, date, start_time, end_time, sessions_used_default, status)
select '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003',
       d, '10:00', '16:00', 1, 'scheduled'
from saturdays
where rn = 3
  and not exists (
    select 1 from public.sessions s
    where s.workshop_id = '60000000-0000-0000-0000-000000000003' and s.date = saturdays.d
  );

-- subscriptions: câte unul din fiecare culoare, ca să vezi indicatorul pe
-- ecranul de prezență -- 🟢 Maria (multe ședințe, departe de expirare),
-- 🟡 Andrei (o singură ședință în abonament -> "mai are 1"),
-- 🔴 Ioana (abonament expirat). Restul copiilor nu au abonament deloc, ceea
-- ce arată tot 🔴 și propune drop-in -- e cazul implicit, nu trebuie seedat.
insert into public.subscriptions (
  id, child_id, workshop_id, name, total_sessions, price_per_session, price, start_date, end_date, status
) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001', 'Abonament 8 ședințe', 8, 60, 480,
    current_date - 14, current_date + 60, 'active'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001', 'Abonament 1 ședință', 1, 60, 60,
    current_date - 7, current_date + 30, 'active'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001', 'Abonament 8 ședințe (expirat)', 8, 60, 480,
    current_date - 90, current_date - 10, 'expired')
on conflict (id) do nothing;

-- payments: Maria e la zi; Ioana a plătit doar parțial -> restanță, ca să
-- vezi ecranul "Cine are restanțe". Presupune că există deja un cont admin
-- (secțiunea "Primul cont de administrator" din README) -- recorded_by nu
-- poate fi null.
insert into public.payments (id, child_id, subscription_id, amount, paid_at, method, note, recorded_by) values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', 480, current_date - 13, 'cash', null,
    (select id from public.users where role = 'admin' limit 1)),
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000003', 200, current_date - 89, 'transfer', null,
    (select id from public.users where role = 'admin' limit 1))
on conflict (id) do nothing;
