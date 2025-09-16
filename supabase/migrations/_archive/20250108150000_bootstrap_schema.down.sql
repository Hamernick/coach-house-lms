set search_path = public;

DROP POLICY IF EXISTS "subscriptions_admin_manage" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_self_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_self_read" ON subscriptions;
DROP POLICY IF EXISTS "progress_admin_manage" ON module_progress;
DROP POLICY IF EXISTS "progress_self_update" ON module_progress;
DROP POLICY IF EXISTS "progress_self_upsert" ON module_progress;
DROP POLICY IF EXISTS "progress_self_access" ON module_progress;
DROP POLICY IF EXISTS "enrollments_admin_manage" ON enrollments;
DROP POLICY IF EXISTS "enrollments_self_insert" ON enrollments;
DROP POLICY IF EXISTS "enrollments_self_read" ON enrollments;
DROP POLICY IF EXISTS "modules_admin_manage" ON modules;
DROP POLICY IF EXISTS "modules_view_published" ON modules;
DROP POLICY IF EXISTS "classes_admin_manage" ON classes;
DROP POLICY IF EXISTS "classes_view_enrolled" ON classes;
DROP POLICY IF EXISTS "classes_view_published" ON classes;
DROP POLICY IF EXISTS "profiles_admin_manage" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_self_manage" ON profiles;

ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.is_admin();
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON subscriptions;
DROP TRIGGER IF EXISTS set_updated_at_module_progress ON module_progress;
DROP TRIGGER IF EXISTS set_updated_at_modules ON modules;
DROP TRIGGER IF EXISTS set_updated_at_classes ON classes;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();

DROP INDEX IF EXISTS subscriptions_user_id_idx;
DROP INDEX IF EXISTS module_progress_module_id_idx;
DROP INDEX IF EXISTS module_progress_user_id_idx;
DROP INDEX IF EXISTS enrollments_class_id_idx;
DROP INDEX IF EXISTS enrollments_user_id_idx;
DROP INDEX IF EXISTS modules_class_id_idx;

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS module_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS profiles;

DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS module_progress_status;
DROP TYPE IF EXISTS user_role;
