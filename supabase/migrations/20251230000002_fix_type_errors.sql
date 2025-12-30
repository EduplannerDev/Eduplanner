-- Migration: 20251230000002_fix_type_errors.sql
-- Description: Fixes "type mismatch" AND "duplicate key" logic in Dashboard Pulse RPCs.

-- 3. High Risk Students (SIAT style) - Fix Type Mismatch & Deduplicate Students
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
  )
  select 
    a.id as alumno_id,
    a.nombre_completo::text as nombre_completo, -- Force cast to text
    g.nombre::text as grupo, -- Force cast to text
    'Incidencia: ' || r.descripcion_hechos as motivo,
    r.nivel_riesgo::text
  from RankedIncidents r
  join alumnos a on r.alumno_id = a.id
  left join grupos g on a.grupo_id = g.id
  where r.rn = 1 -- Keep only the top ranked incident per student
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
