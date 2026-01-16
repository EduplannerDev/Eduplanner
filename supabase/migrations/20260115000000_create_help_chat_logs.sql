-- Create table for storing help chat logs
create table if not exists help_chat_logs (
    id uuid default gen_random_uuid() primary key,
    -- Change reference to profiles instead of auth.users to enable implicit joins in Supabase client
    user_id uuid references public.profiles(id) on delete set null, 
    question text not null,
    answer text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

-- Add RLS policies
alter table help_chat_logs enable row level security;

-- Allow insert for authenticated users (users logging their own chats)
create policy "Users can insert their own chat logs"
    on help_chat_logs for insert
    with check (auth.uid() = user_id);

-- Allow users to view their own logs
create policy "Users can view own chat logs"
    on help_chat_logs for select
    using (auth.uid() = user_id);

-- Allow admins/directors to view all logs (assuming implicit permission or role check logic elsewhere, 
-- but explicitly adding a policy for specific emails or roles if available would be better. 
-- For now, we will allow read access to authenticated users if they are admin/director, 
-- but since policy logic can be complex without known helper functions, 
-- we'll rely on the backend/admin client bypassing RLS or having a specific policy)

-- Assuming a "is_admin" function exists or check against profiles.role
-- Let's try to add a policy for admins if the role column exists in profiles (which it does based on other files)
create policy "Admins can view all chat logs"
    on help_chat_logs for select
    using (
      exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role in ('administrador', 'director') -- Ajustar roles según tu esquema exacto
      )
    );
