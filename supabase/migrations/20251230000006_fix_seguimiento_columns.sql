-- Migration: 20251230000006_fix_seguimiento_columns.sql
-- Description: Updates seguimiento_diario structure to support 'contacto_familia' and fixes column references.

-- 1. Update the CHECK constraint on seguimiento_diario to allow 'contacto_familia'
alter table seguimiento_diario drop constraint if exists seguimiento_diario_tipo_check;

alter table seguimiento_diario add constraint seguimiento_diario_tipo_check 
  check (tipo in ('general', 'academico', 'comportamiento', 'logro', 'contacto_familia'));

-- 2. Update the function to use correct column names: 'tipo' instead of 'tipo_intervencion'
create or replace function get_alertas_riesgo_siat(
  p_plantel_id uuid,
  p_limit int default 5
)
returns table (
  alumno_id uuid,
  nombre_completo text,
  grupo text,
  motivo text,
  nivel_riesgo text
)
language plpgsql
security definer
as $$
begin
  -- Logic: Students with CRITICAL or ALTO incidents in the last 30 days
  -- Excludes students who have been contacted in the last 24 hours
  -- Uses CTE to pick the single most severe incident per student to avoid duplicates
  return query
  with RankedIncidents as (
    select 
      i.alumno_id,
      i.descripcion_hechos,
      i.nivel_riesgo,
      i.fecha_incidente,
      row_number() over (
        partition by i.alumno_id 
        order by 
          case i.nivel_riesgo 
            when 'critico' then 1 
            when 'alto' then 2 
            else 3 
          end asc, 
          i.fecha_incidente desc
      ) as rn
    from incidencias i
    where i.plantel_id = p_plantel_id
      and i.nivel_riesgo in ('critico', 'alto')
      and i.fecha_incidente > (current_date - interval '30 days')
  ),
  RecentContacts as (
    select distinct sd.alumno_id
    from seguimiento_diario sd
    where sd.tipo = 'contacto_familia'   -- Corrected column: tipo
      and sd.created_at > (now() - interval '24 hours')
  )
  select 
    a.id as alumno_id,
    a.nombre_completo::text as nombre_completo,
    g.nombre::text as grupo,
    'Incidencia: ' || r.descripcion_hechos as motivo,
    r.nivel_riesgo::text
  from RankedIncidents r
  join alumnos a on r.alumno_id = a.id
  left join grupos g on a.grupo_id = g.id
  left join RecentContacts rc on a.id = rc.alumno_id
  where r.rn = 1 
    and rc.alumno_id is null -- Exclude students with recent contact
  order by 
    case r.nivel_riesgo 
      when 'critico' then 1 
      when 'alto' then 2 
      else 3 
    end asc,
    r.fecha_incidente desc
  limit p_limit;
end;
$$;
