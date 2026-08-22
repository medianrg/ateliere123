-- Date de test: 3 grupe, 10 copii, 5 ședințe (2 azi), 2 abonamente.
-- Rulează o singură dată, în Supabase Studio -> SQL Editor, DUPĂ ce ai
-- aplicat 0000_*.sql și 0001_rls_policies.sql. Sigur de rulat de mai multe
-- ori (foloseşte ON CONFLICT DO NOTHING pe id-uri fixe).

-- session_types --------------------------------------------------------
insert into public.session_types (id, name, suggested_credit_cost, counts_in_stats, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'Obișnuit', 1, true, true),
  ('10000000-0000-0000-0000-000000000002', 'Special', 0, false, true)
on conflict (id) do nothing;

-- groups -----------------------------------------------------------------
insert into public.groups (id, name, min_age, max_age, color, default_day, default_time, sort_order) values
  ('20000000-0000-0000-0000-000000000001', 'Grupa mică (8-10)', 8, 10, '#60a5fa', 'Marți', '17:00', 1),
  ('20000000-0000-0000-0000-000000000002', 'Grupa mijlocie (11-12)', 11, 12, '#34d399', 'Miercuri', '17:30', 2),
  ('20000000-0000-0000-0000-000000000003', 'Grupa mare (14-16)', 14, 16, '#f472b6', 'Joi', '18:00', 3)
on conflict (id) do nothing;

-- children -----------------------------------------------------------------
insert into public.children (id, first_name, last_name, birth_date, group_id, payment_status) values
  ('30000000-0000-0000-0000-000000000001', 'Maria', 'Popescu', '2017-03-12', '20000000-0000-0000-0000-000000000001', 'standard'),
  ('30000000-0000-0000-0000-000000000002', 'Andrei', 'Ionescu', '2016-07-04', '20000000-0000-0000-0000-000000000001', 'standard'),
  ('30000000-0000-0000-0000-000000000003', 'Ioana', 'Radu', '2016-11-20', '20000000-0000-0000-0000-000000000001', 'partial'),
  ('30000000-0000-0000-0000-000000000004', 'Matei', 'Dumitru', '2015-01-09', '20000000-0000-0000-0000-000000000002', 'standard'),
  ('30000000-0000-0000-0000-000000000005', 'Elena', 'Stan', '2014-09-17', '20000000-0000-0000-0000-000000000002', 'standard'),
  ('30000000-0000-0000-0000-000000000006', 'David', 'Constantin', '2014-05-23', '20000000-0000-0000-0000-000000000002', 'exempt'),
  ('30000000-0000-0000-0000-000000000007', 'Sofia', 'Gheorghe', '2013-12-02', '20000000-0000-0000-0000-000000000002', 'standard'),
  ('30000000-0000-0000-0000-000000000008', 'Vlad', 'Marin', '2011-06-14', '20000000-0000-0000-0000-000000000003', 'standard'),
  ('30000000-0000-0000-0000-000000000009', 'Ana', 'Barbu', '2010-08-30', '20000000-0000-0000-0000-000000000003', 'partial'),
  ('30000000-0000-0000-0000-00000000000a', 'Tudor', 'Florea', '2010-02-19', '20000000-0000-0000-0000-000000000003', 'standard')
on conflict (id) do nothing;

-- consents (una per copil, variate ca să se vadă toate cele trei culori) ---
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

-- sessions: 2 azi (una per grupa mică și mijlocie), restul recente/viitoare -
insert into public.sessions (id, session_type_id, group_id, date, start_time, end_time, credit_cost, topic, status) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date, '17:00', '19:00', 1, 'Origami', 'scheduled'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', current_date, '17:30', '19:30', 1, 'Robotică', 'scheduled'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', current_date - 7, '18:00', '20:00', 1, 'Pictură', 'completed'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date + 7, '17:00', '19:00', 1, 'Colaj', 'scheduled'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', null, current_date + 14, '10:00', '14:00', 2, 'Atelier de vacanță', 'scheduled')
on conflict (id) do nothing;

update public.sessions set title = 'Atelier de vacanță — o zi întreagă'
  where id = '40000000-0000-0000-0000-000000000005' and title is null;

-- subscriptions (doar date, fără ecran dedicat până în Faza 2) -------------
insert into public.subscriptions (id, child_id, name, total_credits, price, start_date, end_date, status) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Abonament 8 ședințe', 8, 320, current_date - 14, current_date + 60, 'active'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'Abonament 8 ședințe', 8, 320, current_date - 14, current_date + 60, 'active')
on conflict (id) do nothing;
