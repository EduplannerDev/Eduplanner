-- Migration: 20251230000007_add_seguimiento_profiles_fk.sql
-- Description: Adds a foreign key from seguimiento_diario to profiles to enable joins (fetching director name).

-- Add foreign key constraint to profiles table
-- This allows PostgREST to detect the relationship for: select(*, director:profiles(*))
alter table seguimiento_diario
add constraint fk_seguimiento_profiles
foreign key (user_id)
references profiles(id)
on delete cascade;
