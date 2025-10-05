import { supabase } from "./supabase";

export interface Examen {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  content: any; // Usar 'any' o definir una interfaz más específica para el contenido del examen
  title: string | null;
  subject: string | null;
  is_public: boolean;
  shared_with: string[] | null; // Array de UUIDs de usuarios
}

// Obtener exámenes generados por el usuario
export async function getExamenesByOwner(userId: string): Promise<Examen[]> {
  try {
    const { data, error } = await supabase
      .from("examenes")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exams by owner:", error);
      return [];
    }

    return data as Examen[];
  } catch (error) {
    console.error("Error in getExamenesByOwner:", error);
    return [];
  }
}

// Obtener exámenes compartidos con el usuario
export async function getSharedExamenes(userId: string): Promise<Examen[]> {
  try {
    const { data, error } = await supabase
      .from("examenes")
      .select("*")
      .contains("shared_with", [userId]) // Busca si el userId está en el array shared_with
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared exams:", error);
      return [];
    }

    return data as Examen[];
  } catch (error) {
    console.error("Error in getSharedExamenes:", error);
    return [];
  }
}

// Obtener exámenes públicos
export async function getPublicExamenes(): Promise<Examen[]> {
  try {
    const { data, error } = await supabase
      .from("examenes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public exams:", error);
      return [];
    }

    return data as Examen[];
  } catch (error) {
    console.error("Error in getPublicExamenes:", error);
    return [];
  }
}

// Crear un nuevo examen
export async function createExamen(examenData: Omit<Examen, 'id' | 'created_at' | 'updated_at'>): Promise<Examen | null> {
  try {
    const { data, error } = await supabase
      .from("examenes")
      .insert(examenData)
      .select()
      .single();

    if (error) {
      console.error("Error creating exam:", error);
      return null;
    }

    // Insertar registro en exam_creations para rastrear límites lifetime
    const { error: creationError } = await supabase
      .from("exam_creations")
      .insert({
        user_id: examenData.owner_id,
        exam_id: data.id,
        created_at: data.created_at
      });

    if (creationError) {
      console.error("Error creating exam creation record:", creationError);
      // No retornamos null aquí porque el examen ya se creó exitosamente
      // Solo logueamos el error para debugging
    }

    return data as Examen;
  } catch (error) {
    console.error("Error in createExamen:", error);
    return null;
  }
}

// Actualizar un examen
export async function updateExamen(id: string, updates: Partial<Omit<Examen, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("examenes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating exam:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateExamen:", error);
    return false;
  }
}

// Obtener un examen específico por ID
export async function getExamenById(id: string): Promise<Examen | null> {
  try {
    const { data, error } = await supabase
      .from("examenes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching exam by ID ${id}:`, error);
      return null;
    }

    return data as Examen;
  } catch (error) {
    console.error(`Error in getExamenById for ID ${id}:`, error);
    return null;
  }
}

// Eliminar un examen
export async function deleteExamen(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("examenes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting exam:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteExamen:", error);
    return false;
  }
}