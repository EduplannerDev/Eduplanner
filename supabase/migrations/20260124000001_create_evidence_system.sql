-- Create actividad_evidencias table
create table if not exists "public"."actividad_evidencias" (
    "id" uuid not null default gen_random_uuid() primary key,
    "actividad_id" uuid not null references "public"."actividades_evaluables"("id") on delete cascade,
    "user_id" uuid not null references "auth"."users"("id") on delete cascade,
    "url" text not null,
    "tipo" character varying(50) not null, -- imagen, video, audio, documento, otro
    "nombre_archivo" text,
    "created_at" timestamp with time zone default now()
);

alter table "public"."actividad_evidencias" enable row level security;

-- Storage Bucket Setup
insert into storage.buckets (id, name, public)
values ('evidencias_actividades', 'evidencias_actividades', true)
on conflict (id) do nothing;

-- RLS Policies for actividad_evidencias

-- Policy: Users can view evidences for their groups
create policy "Users can view evidences for their groups"
    on "public"."actividad_evidencias"
    for select
    using (
        exists (
            select 1 from "public"."actividades_evaluables"
            join "public"."grupos" on "grupos"."id" = "actividades_evaluables"."grupo_id"
            where "actividades_evaluables"."id" = "actividad_evidencias"."actividad_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can insert evidences for their groups
create policy "Users can insert evidences for their groups"
    on "public"."actividad_evidencias"
    for insert
    with check (
        auth.uid() = user_id AND
        exists (
            select 1 from "public"."actividades_evaluables"
            join "public"."grupos" on "grupos"."id" = "actividades_evaluables"."grupo_id"
            where "actividades_evaluables"."id" = "actividad_evidencias"."actividad_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can delete their evidences
create policy "Users can delete their evidences"
    on "public"."actividad_evidencias"
    for delete
    using (
        auth.uid() = user_id
    );

-- Storage Policies

-- Policy: Give users access to their own folder (based on group ownership logic somewhat, or simpler: just authenticated users can upload if they own the group)
-- Storage RLS is a bit different. Let's start with basic authenticated access for the bucket, refining to specific paths if needed.
-- But standard practice:
create policy "Give users access to own folder 10ffw_0" 
on storage.objects for select 
to authenticated 
using (bucket_id = 'evidencias_actividades');

create policy "Give users access to own folder 10ffw_1" 
on storage.objects for insert 
to authenticated 
with check (bucket_id = 'evidencias_actividades');

create policy "Give users access to own folder 10ffw_2" 
on storage.objects for update
to authenticated 
using (bucket_id = 'evidencias_actividades');

create policy "Give users access to own folder 10ffw_3" 
on storage.objects for delete 
to authenticated 
using (bucket_id = 'evidencias_actividades');

-- Indexes
create index if not exists idx_evidencias_actividad_id on "public"."actividad_evidencias"("actividad_id");
