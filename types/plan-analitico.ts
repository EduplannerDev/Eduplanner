export interface PlanAnaliticoFormData {
    // Step 1: Diagnóstico
    grupo_id: string
    ciclo_escolar: string
    input_comunitario: string
    input_escolar: string
    input_grupo: string
    diagnostico_generado: string

    // Step 2: Contextualización (Problemáticas)
    problematicas: Problematica[]

    // Step 3: Codiseño
    nuevos_pdas: NuevoPDA[]
}

export interface Problematica {
    id: string // UUID temporal o real
    titulo: string
    descripcion: string
    pdas_seleccionados: string[] // IDs de curriculo_sep
}

export interface NuevoPDA {
    id: string // UUID temporal
    campo_formativo: string
    contenido: string
    pda: string
}

export interface WizardStep {
    id: number
    title: string
    description: string
    current: boolean
    completed: boolean
}
