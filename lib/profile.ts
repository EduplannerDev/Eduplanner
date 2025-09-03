import { supabase } from "./supabase"; // Asegúrate de que la ruta a tu cliente Supabase sea correcta

// Enum para roles del sistema
export type UserRole = 'administrador' | 'director' | 'profesor';

// Interface para planteles
export interface Plantel {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  codigo_plantel?: string;
  nivel_educativo: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Campos de límites de usuarios
  max_usuarios?: number;
  max_profesores?: number;
  max_directores?: number;
  plan_suscripcion?: string;
  estado_suscripcion?: string;
  fecha_vencimiento?: string;
}

// Interface actualizada para perfiles
export interface Profile {
  id: string; // Debe coincidir con auth.users.id y ser la clave primaria en tu tabla 'profiles'
  plantel_id?: string | null;
  role: UserRole;
  full_name: string | null;
  email?: string | null;
  telefono?: string | null;
  avatar_url: string | null;
  activo: boolean;
  // Campos de suscripción
  subscription_plan: "free" | "pro";
  subscription_status: "active" | "cancelled" | "cancelling" | "past_due" | "unpaid" | "incomplete" | "incomplete_expired" | "trialing" | "paused" | null;
  subscription_end_date: string | null;
  subscription_renew_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  cancel_at_period_end: boolean;
  // Metadatos
  created_at: string;
  updated_at: string;
  // Relación con plantel (opcional para joins)
  plantel?: Plantel;
}

// Interface para asignaciones de planteles
export interface UserPlantelAssignment {
  id: string;
  user_id: string;
  plantel_id: string;
  role: UserRole;
  activo: boolean;
  assigned_at: string;
  assigned_by?: string;
  // Relaciones opcionales
  plantel?: Plantel;
  user?: Profile;
  profiles?: Profile; // Para joins de Supabase
}

export interface ProfileUpdate {
  plantel_id?: string | null;
  role?: UserRole;
  full_name?: string;
  email?: string;
  telefono?: string;
  avatar_url?: string;
  activo?: boolean;
  subscription_plan?: "free" | "pro";
  subscription_status?: "active" | "cancelled" | "cancelling" | "past_due" | "unpaid" | "incomplete" | "incomplete_expired" | "trialing" | "paused" | null;
  subscription_end_date?: string | null;
  subscription_renew_date?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  cancel_at_period_end?: boolean;
}

// Obtener perfil del usuario
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("getProfile: userId no fue proporcionado.");
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching profile for userId ${userId}:`, error.message);
      return null;
    }
    return data as Profile | null;
  } catch (error) {
    console.error("Excepción en getProfile:", (error as Error).message);
    return null;
  }
}

// Actualizar perfil del usuario
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<boolean> {
  if (!userId) {
    console.error("updateProfile: userId no fue proporcionado.");
    return false;
  }
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error(`Error updating profile for userId ${userId}:`, error.message);
      return false;
    }
    console.log(`Profile for userId ${userId} updated successfully.`);
    return true;
  } catch (error) {
    console.error("Excepción en updateProfile:", (error as Error).message);
    return false;
  }
}

// Crear perfil si no existe
export async function createProfile(userId: string, data: Partial<Omit<Profile, 'id' | 'subscription_plan' | 'created_at' | 'updated_at'>>) {
  if (!userId) {
    console.error("createProfile: userId no fue proporcionado. No se puede crear el perfil.");
    throw new Error("UserID es requerido para crear un perfil.");
  }

  try {
    const profileDataToInsert = {
      id: userId, // Este ID debe coincidir con auth.uid() para que la política RLS funcione
      ...data,
      subscription_plan: "free" as const, // Valor por defecto
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };


    const { error } = await supabase.from("profiles").insert([profileDataToInsert]);

    if (error) {
      console.error(`Error creating profile for userId ${userId}:`, error.message);
      // Log adicional para depurar el estado de autenticación en caso de error
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("createProfile (on error): Error al obtener la sesión:", sessionError.message);
        } else if (!sessionData.session) {
          console.error("createProfile (on error): No hay sesión activa de Supabase encontrada.");
        } else {
          console.error(`createProfile (on error): Sesión activa para usuario: ${sessionData.session.user.id}. UserId pasado: ${userId}`);
          if (sessionData.session.user.id !== userId) {
            console.warn(
              "createProfile (on error): ¡DISCREPANCIA! El ID del usuario de la sesión no coincide con el userId pasado a createProfile."
            );
          }
        }
      } catch (e) {
        console.error("createProfile (on error): Excepción al intentar obtener la sesión para depuración:", (e as Error).message);
      }
      throw error; // Re-lanzar el error original de Supabase
    }
    // createProfile no necesita devolver el perfil, getOrCreateProfile se encarga de volver a buscarlo.
  } catch (error) {
    // Si no es un error de Supabase, igual lo capturamos y relanzamos
    if (!(error as any)?.message.includes('permission denied') && !(error as any)?.message.includes('duplicate key')) { // Ejemplo
        console.error("Excepción en createProfile:", (error as Error).message);
    }
    throw error; // Asegurarse de que el error se propague a getOrCreateProfile
  }
}

// Obtener o crear perfil
export async function getOrCreateProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("getOrCreateProfile: userId no fue proporcionado.");
    return null;
  }

  try {
    // Primero intentar obtener el perfil existente
    let profile = await getProfile(userId);

    if (profile) {
      return profile;
    }

    // Si no existe, procede a crear uno nuevo
    await createProfile(userId, {
      // Proporciona aquí los valores por defecto que desees para un nuevo perfil
      // La interfaz Profile ya define la mayoría como 'string | null'
      full_name: null,
      avatar_url: null,
      role: 'profesor',
      activo: true
    });

    // Después de una creación exitosa (createProfile no lanzó error), obtener el perfil recién creado.
    profile = await getProfile(userId);

    if (!profile) {
      console.error(`FALLO CRÍTICO: Perfil para userId ${userId} no encontrado incluso después del intento de creación.`);
      // Esto podría indicar un problema con la política SELECT o un retraso, aunque es menos probable.
    }

    return profile;

  } catch (error) {
    // El error de createProfile (incluido el de RLS) será capturado aquí
    console.error(`Error en getOrCreateProfile para userId ${userId}:`, (error as Error).message);
    // Puedes inspeccionar el error más a fondo si es necesario
    // console.error("Objeto de error completo en getOrCreateProfile:", error);
    return null; // Devuelve null si hubo un error en el proceso
  }
}

// Función para subir el avatar y actualizar la URL en el perfil
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  if (!userId) {
    console.error("uploadAvatar: userId no fue proporcionado.");
    return null;
  }
  if (!file) {
    console.error("uploadAvatar: archivo no fue proporcionado.");
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars') // Asegúrate de tener un bucket llamado 'avatars' en Supabase Storage
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;

    // Actualizar la URL del avatar en el perfil del usuario
    const success = await updateProfile(userId, { avatar_url: publicUrl });

    if (!success) {
      console.error("Error updating profile with new avatar URL.");
      return null;
    }

    return publicUrl;
  } catch (error) {
    console.error("Excepción en uploadAvatar:", (error as Error).message);
    return null;
  }
}

// Función para verificar si existe un perfil
export async function profileExists(userId: string): Promise<boolean> {
  if (!userId) {
    console.error("profileExists: userId no fue proporcionado.");
    return false;
  }
  try {
    const { data, error, count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }) // Más eficiente, solo pide el conteo
      .eq("id", userId);

    if (error) {
      console.error(`Error checking profile existence for userId ${userId}:`, error.message);
      return false;
    }
    return count !== null && count > 0;
  } catch (error) {
    console.error("Excepción en profileExists:", (error as Error).message);
    return false;
  }
}

// Función para invitar un usuario por email
export async function inviteUserByEmail(
  email: string,
  plantelId: string,
  role: UserRole,
  invitedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Llamar a la API route que maneja las invitaciones con privilegios de admin
    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        plantelId,
        role,
        invitedBy
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Error al invitar usuario'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Exception in inviteUserByEmail:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}