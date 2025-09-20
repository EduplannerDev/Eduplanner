// Tipos para el módulo de proyectos
export interface Proyecto {
  id: string
  profesor_id: string
  grupo_id: string
  nombre: string
  problematica: string
  producto_final: string
  metodologia_nem: string
  estado: 'activo' | 'archivado'
  fecha_inicio?: string
  fecha_fin?: string
  created_at: string
  updated_at: string
}

export interface ProyectoCurriculo {
  id: string
  proyecto_id: string
  curriculo_id: string
  created_at: string
}

export interface ProyectoFase {
  id: string
  proyecto_id: string
  fase_nombre: string
  momento_nombre: string
  contenido: string
  orden: number
  created_at: string
  updated_at: string
}

// Tipos para el asistente de proyectos
export interface ProyectoWizardData {
  // Paso 1: Define tu Proyecto
  nombre: string
  problematica: string
  producto_final: string
  grupo_id: string
  metodologia_nem: string
  
  // Paso 2: Selecciona PDAs (se agregará después)
  pdas_seleccionados: string[]
  
  // Paso 3: Generar Contenido (se agregará después)
  fases_generadas: ProyectoFase[]
}

export interface ProyectoWizardStep {
  id: number
  title: string
  description: string
  completed: boolean
  current: boolean
}

// Tipos para formularios
export interface ProyectoFormData {
  nombre: string
  problematica: string
  producto_final: string
  grupo_id: string
  metodologia_nem: string
}

// Tipos para las opciones de metodología
export interface MetodologiaOption {
  value: string
  label: string
  description: string
}

// Tipos para grupos (para el selector)
export interface GrupoOption {
  id: string
  nombre: string
  grado: number
  nivel: string
}
