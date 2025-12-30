-- Migration: 20251230000001_fix_dashboard_pulse.sql
-- Description: Fixes for Dashboard "Pulse" tab RPCs (Table names, columns, and types).

-- 1. Weekly Planning Compliance (vs Active Teachers)
-- Fixes: Uses 'activo' (boolean) instead of 'estatus', uses 'profiles' correctly.
create or replace function get_cumplimiento_planeaciones_semanal(
  p_plantel_id uuid
)
returns table (
  total_enviadas bigint,
  total_profesores bigint,
  porcentaje numeric
)
language plpgsql
security definer
as $$
declare
  v_count_teachers bigint;
  v_count_enviadas bigint;
begin
  -- Count active teachers in the plantel
  select count(*)
  into v_count_teachers
  from profiles
  where plantel_id = p_plantel_id
    and role = 'profesor'
    and (activo is true); 

  -- Count planning submissions for the current week (ISO week)
  select count(distinct profesor_id)
  into v_count_enviadas
  from planeaciones_enviadas
  where plantel_id = p_plantel_id
    and fecha_envio >= date_trunc('week', current_date)
    and fecha_envio < date_trunc('week', current_date) + interval '1 week';

  return query
  select 
    v_count_enviadas, 
    v_count_teachers,
    case 
      when v_count_teachers > 0 then round((v_count_enviadas::numeric / v_count_teachers::numeric) * 100, 2)
      else 0 
    end;
end;
$$;


-- 2. Daily Security Summary
-- Fixes: Explicit cast of 'nivel_riesgo' enum to text to match return type.
create or replace function get_resumen_seguridad_diario(
  p_plantel_id uuid
)
returns table (
  nivel_riesgo text,
  cantidad bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    i.nivel_riesgo::text,
    count(*) as cantidad
  from incidencias i
  where i.plantel_id = p_plantel_id
    and i.fecha_incidente::date = current_date
  group by i.nivel_riesgo;
end;
$$;


-- 3. High Risk Students (SIAT style)
-- Fixes: Joins 'alumnos' instead of 'alumnos_seguimiento', uses 'descripcion_hechos' and proper enum values.
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
  return query
  select 
    a.id as alumno_id,
    a.nombre_completo::text as nombre_completo,
    g.nombre::text as grupo,
    'Incidencia Reciente: ' || i.descripcion_hechos as motivo, 
    i.nivel_riesgo::text
  from incidencias i
  join alumnos a on i.alumno_id = a.id
  left join grupos g on a.grupo_id = g.id
  where i.plantel_id = p_plantel_id
    and i.nivel_riesgo in ('critico', 'alto') -- Case sensitive match for enum
    and i.fecha_incidente > (current_date - interval '30 days')
  order by 
    case i.nivel_riesgo 
      when 'critico' then 1 
      when 'alto' then 2 
      else 3 
    end asc,
    i.fecha_incidente desc
  limit p_limit;
end;
$$;


-- 4. Average Attendance Today
-- Fixes: Uses 'alumnos' joining 'grupos' correctly.
create or replace function get_asistencia_diaria_plantel(
  p_plantel_id uuid
)
returns numeric
language plpgsql
security definer
as $$
declare
  v_total_alumnos bigint;
  v_presentes bigint;
begin
  -- Total active students
  select count(a.id) into v_total_alumnos
  from alumnos a
  join grupos g on a.grupo_id = g.id
  where g.plantel_id = p_plantel_id
  and g.activo = true;

  if v_total_alumnos = 0 then 
    return 0;
  end if;

  -- Count students marked as 'presente' TODAY
  select count(distinct a.alumno_id) into v_presentes
  from asistencia a
  join alumnos al on a.alumno_id = al.id
  join grupos g on al.grupo_id = g.id
  where g.plantel_id = p_plantel_id
    and a.fecha::date = current_date
    and a.estado = 'presente';

  return round((v_presentes::numeric / v_total_alumnos::numeric) * 100, 2);
end;
$$;


-- 5. Recently Active Teachers
-- Fixes: Uses 'full_name' from profiles.
create or replace function get_profesores_activos_recientes(
  p_plantel_id uuid,
  p_limit int default 5
)
returns table (
  profesor_id uuid,
  nombre_completo text,
  ultima_actividad timestamp
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id as profesor_id,
    p.full_name as nombre_completo,
    pe.created_at as ultima_actividad
  from planeaciones_enviadas pe
  join profiles p on pe.profesor_id = p.id
  where pe.plantel_id = p_plantel_id
  order by pe.created_at desc
  limit p_limit;
end;
$$;
