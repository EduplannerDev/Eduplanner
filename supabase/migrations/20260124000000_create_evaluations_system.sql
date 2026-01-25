-- Create handle_updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create actividades_evaluables table
create table if not exists "public"."actividades_evaluables" (
    "id" uuid not null default gen_random_uuid() primary key,
    "grupo_id" uuid not null references "public"."grupos"("id") on delete cascade,
    "nombre" text not null,
    "tipo" character varying(50) not null default 'tarea', -- examen, tarea, proyecto, participacion
    "descripcion" text,
    "fecha_entrega" timestamp with time zone,
    "ponderacion" integer default 10, -- Porcentaje del valor final (0-100)
    "examen_id" uuid references "public"."examenes"("id") on delete set null,
    "planeacion_id" uuid references "public"."planeaciones"("id") on delete set null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted_at" timestamp with time zone
);

alter table "public"."actividades_evaluables" enable row level security;

-- Create calificaciones table
create table if not exists "public"."calificaciones" (
    "id" uuid not null default gen_random_uuid() primary key,
    "actividad_id" uuid not null references "public"."actividades_evaluables"("id") on delete cascade,
    "alumno_id" uuid not null references "public"."alumnos"("id") on delete cascade,
    "calificacion" numeric(4,2), -- 0.00 to 10.00
    "retroalimentacion" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."calificaciones" enable row level security;

-- Add updated_at trigger for actividades_evaluables
create trigger handle_updated_at_actividades_evaluables
    before update on public.actividades_evaluables
    for each row
    execute procedure public.handle_updated_at();

-- Add updated_at trigger for calificaciones
create trigger handle_updated_at_calificaciones
    before update on public.calificaciones
    for each row
    execute procedure public.handle_updated_at();

-- RLS Policies for actividades_evaluables

-- Policy: Users can view activities for groups they own
create policy "Users can view activities for their groups"
    on "public"."actividades_evaluables"
    for select
    using (
        exists (
            select 1 from "public"."grupos"
            where "grupos"."id" = "actividades_evaluables"."grupo_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can insert activities for their groups
create policy "Users can insert activities for their groups"
    on "public"."actividades_evaluables"
    for insert
    with check (
        exists (
            select 1 from "public"."grupos"
            where "grupos"."id" = "actividades_evaluables"."grupo_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can update activities for their groups
create policy "Users can update activities for their groups"
    on "public"."actividades_evaluables"
    for update
    using (
        exists (
            select 1 from "public"."grupos"
            where "grupos"."id" = "actividades_evaluables"."grupo_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can delete activities for their groups
create policy "Users can delete activities for their groups"
    on "public"."actividades_evaluables"
    for delete
    using (
        exists (
            select 1 from "public"."grupos"
            where "grupos"."id" = "actividades_evaluables"."grupo_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- RLS Policies for calificaciones

-- Policy: Users can view grades for activities in their groups
create policy "Users can view grades for their groups"
    on "public"."calificaciones"
    for select
    using (
        exists (
            select 1 from "public"."actividades_evaluables"
            join "public"."grupos" on "grupos"."id" = "actividades_evaluables"."grupo_id"
            where "actividades_evaluables"."id" = "calificaciones"."actividad_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Policy: Users can insert/update grades for their groups
create policy "Users can manage grades for their groups"
    on "public"."calificaciones"
    for all
    using (
        exists (
            select 1 from "public"."actividades_evaluables"
            join "public"."grupos" on "grupos"."id" = "actividades_evaluables"."grupo_id"
            where "actividades_evaluables"."id" = "calificaciones"."actividad_id"
            and "grupos"."user_id" = auth.uid()
        )
    );

-- Indexes for performance
create index if not exists idx_actividades_grupo_id on "public"."actividades_evaluables"("grupo_id");
create index if not exists idx_calificaciones_actividad_id on "public"."calificaciones"("actividad_id");
create index if not exists idx_calificaciones_alumno_id on "public"."calificaciones"("alumno_id");

-- Add unique constraint to prevent duplicates
alter table "public"."calificaciones" 
add constraint "unique_calificacion_alumno_actividad" 
unique ("actividad_id", "alumno_id");
