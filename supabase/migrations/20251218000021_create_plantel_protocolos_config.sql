-- 1. Tabla de Configuración de Protocolos por Plantel
create table public.plantel_protocolos_config (
  id uuid default gen_random_uuid() primary key,
  plantel_id uuid not null references public.planteles(id) unique, -- Una config por plantel
  
  -- A. REGLAS LOGÍSTICAS (Overrides Críticos)
  telefono_emergencia text default '911', 
  nombre_hospital_preferente text default 'Hospital General / Cruz Roja',
  autoridad_interna_contacto text default 'Supervisor Escolar', -- A quién se le avisa primero
  
  -- B. DOCUMENTACIÓN INTERNA (RAG Institucional - Fase 2)
  reglamento_interno_url text, -- Link al PDF subido
  reglamento_interno_texto text, -- Texto extraído para contexto rápido
  
  updated_at timestamptz default now()
);

-- 2. Seguridad RLS
alter table public.plantel_protocolos_config enable row level security;

-- Política: Director puede VER y EDITAR su propia configuración
create policy "Director gestiona sus protocolos"
on public.plantel_protocolos_config
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'director'
    and p.plantel_id = public.plantel_protocolos_config.plantel_id
  )
);
