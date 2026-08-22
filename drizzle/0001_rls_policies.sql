-- Row Level Security: a parent must never be able to reach another child's
-- data, even through a direct API call with the anon key. See CLAUDE.md.
--
-- Helper functions run SECURITY DEFINER so they can read `public.users`
-- (which itself has RLS enabled) without recursing into the same policy
-- they are being called from.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_instructor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'instructor') AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of_child(target_child_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_child
    WHERE parent_user_id = auth.uid() AND child_id = target_child_id
  );
$$;

-- Auto-create a `public.users` row whenever someone signs up through
-- Supabase Auth. New accounts default to role='parent' — Rebecca's own
-- account is bootstrapped to 'admin' once, manually, after her first login
-- (see README.md "Primul cont de administrator").
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

--> statement-breakpoint

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint

-- users: everyone can see their own row; staff can see and manage everyone.
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY users_select_staff ON public.users
  FOR SELECT TO authenticated USING (public.is_admin_or_instructor());
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- groups, session_types: non-sensitive labels. Staff manage; parents can
-- read the active ones (needed to display group/session names).
CREATE POLICY groups_all_staff ON public.groups
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY groups_select_parent ON public.groups
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY session_types_all_staff ON public.session_types
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY session_types_select_parent ON public.session_types
  FOR SELECT TO authenticated USING (is_active = true);

-- children: staff manage everyone; a parent only ever sees their own kids.
CREATE POLICY children_all_staff ON public.children
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY children_select_parent ON public.children
  FOR SELECT TO authenticated USING (public.is_parent_of_child(id));

-- parent_child: staff manage; a parent can see their own links (not other
-- families').
CREATE POLICY parent_child_all_staff ON public.parent_child
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY parent_child_select_own ON public.parent_child
  FOR SELECT TO authenticated USING (parent_user_id = auth.uid());

-- consents: internal to staff only, never exposed to the parent portal.
CREATE POLICY consents_all_staff ON public.consents
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());

-- sessions: staff manage; a parent can see sessions their own child has an
-- attendance record for (needed to render their attendance history).
CREATE POLICY sessions_all_staff ON public.sessions
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY sessions_select_parent ON public.sessions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.session_id = sessions.id AND public.is_parent_of_child(a.child_id)
    )
  );

-- session_participants: manual roster additions, staff-only.
CREATE POLICY session_participants_all_staff ON public.session_participants
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());

-- subscriptions: financial data. Only admin manages it (not instructor); a
-- parent can read their own child's subscriptions.
CREATE POLICY subscriptions_all_admin ON public.subscriptions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY subscriptions_select_parent ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_parent_of_child(child_id));

-- attendance: the operational heart of the app. Both admin and instructor
-- mark it; a parent can only read their own child's rows, never write.
CREATE POLICY attendance_all_staff ON public.attendance
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY attendance_select_parent ON public.attendance
  FOR SELECT TO authenticated USING (public.is_parent_of_child(child_id));

-- payments: financial data, admin only; a parent can read their own
-- child's payment history.
CREATE POLICY payments_all_admin ON public.payments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY payments_select_parent ON public.payments
  FOR SELECT TO authenticated USING (public.is_parent_of_child(child_id));

-- feedback: staff write and manage; a parent only ever sees their own
-- child's *published* feedback — drafts and withdrawn notes stay hidden
-- even at the database level.
CREATE POLICY feedback_all_staff ON public.feedback
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY feedback_select_parent ON public.feedback
  FOR SELECT TO authenticated USING (status = 'published' AND public.is_parent_of_child(child_id));

-- feedback_versions: editorial history, staff-only.
CREATE POLICY feedback_versions_all_staff ON public.feedback_versions
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());

-- feedback_replies: staff read/manage everything; a parent can read and
-- post replies only on their own child's published feedback.
CREATE POLICY feedback_replies_all_staff ON public.feedback_replies
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY feedback_replies_select_parent ON public.feedback_replies
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_replies.feedback_id AND public.is_parent_of_child(f.child_id)
    )
  );
CREATE POLICY feedback_replies_insert_parent ON public.feedback_replies
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_replies.feedback_id
        AND f.status = 'published'
        AND public.is_parent_of_child(f.child_id)
    )
  );

-- notifications_log: staff manage; a parent can see what was sent to them.
CREATE POLICY notifications_log_all_staff ON public.notifications_log
  FOR ALL TO authenticated USING (public.is_admin_or_instructor()) WITH CHECK (public.is_admin_or_instructor());
CREATE POLICY notifications_log_select_parent ON public.notifications_log
  FOR SELECT TO authenticated USING (recipient_parent_id = auth.uid());

-- audit_log: staff can read it (nobody writes to it directly from the
-- client — the app writes it server-side with the service role, which
-- bypasses RLS entirely).
CREATE POLICY audit_log_select_staff ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_admin_or_instructor());
