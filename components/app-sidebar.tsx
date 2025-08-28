"use client"

import type React from "react";

import { FileText, User, LogOut, GraduationCap, Plus, MessageSquare, HelpCircle, Users, BookOpen, Calendar, Bot, Shield } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserData } from "@/hooks/use-user-data"
import { useRoles } from "@/hooks/use-roles"

// Datos del menú principal
const menuItems = [
  {
    title: "Crear Planeación",
    url: "#nueva-planeacion",
    icon: Plus,
    description: "Crear una nueva planeación didáctica",
  },
  {
    title: "Mis Planeaciones",
    url: "#mis-planeaciones",
    icon: FileText,
    description: "Ver y editar planeaciones existentes",
  },
  {
    title: "Mis Exámenes", // NUEVO ITEM
    url: "#examenes",      // URL para la lista de exámenes
    icon: FileText, // Puedes cambiar el icono si lo deseas, ej. ListChecks
    description: "Ver y gestionar tus exámenes",
  },
  {
    title: "Mis Grupos",
    url: "#grupos",
    icon: Users,
    description: "Gestionar grupos de estudiantes",
  },
  {
    title: "Generar Exámenes",
    url: "#generar-examenes",
    icon: GraduationCap,
    description: "Generar exámenes con IA",
  },
  {
    title: "Generar Mensajes",
    url: "#generar-mensajes",
    icon: MessageSquare,
    description: "Generar mensajes para padres de familia",
  },
  {
    title: "Mis Mensajes",
    url: "#mis-mensajes",
    icon: MessageSquare,
    description: "Ver mensajes guardados",
  },
]

// Datos del menú de Mi Espacio
const miEspacioItems = [
  {
    title: "Agenda",
    url: "#agenda",
    icon: Calendar,
    description: "Gestionar tu agenda personal",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange, ...props }: AppSidebarProps) {
  const { user, signOut } = useAuth()
  const { userData } = useUserData(user?.id)
  const { isAdmin, isDirector } = useRoles()

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // Obtener el nombre para mostrar
  const displayName = user?.user_metadata?.full_name || userData?.full_name || "Profesor"

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {/* --- Logo y Texto Alineados Horizontalmente --- */}
        <div className="flex flex-row items-center justify-center gap-3"> {/* Cambiado a flex-row y ajustado gap */}
          {/* Asegúrate de que la ruta sea correcta y la imagen exista en tu carpeta public */}
          <img src="/images/Logo.png" alt="Logo EduPlanner" className="h-10 w-auto" />
          {/* Puedes ajustar la clase h-10 para el tamaño deseado */}
          <div className="text-left"> {/* Cambiado a text-left para alineación con el logo */}
            <span className="block text-sm font-semibold">EduPlanner</span>
            <span className="block text-xs text-muted-foreground">Planeaciones con IA</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === item.url.replace("#", "")}
                    tooltip={item.description}
                  >
                    <button onClick={() => onSectionChange(item.url.replace("#", ""))} className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Módulo de Mi Espacio */}
        <SidebarGroup>
          <SidebarGroupLabel>Mi Espacio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {miEspacioItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === item.url.replace("#", "")}
                    tooltip={item.description}
                  >
                    <button onClick={() => onSectionChange(item.url.replace("#", ""))} className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Módulo de Administración - Solo para admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración Global</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === "admin-dashboard"}
                    tooltip="Panel de administración del sistema"
                  >
                    <button onClick={() => onSectionChange("admin-dashboard")} className="w-full">
                      <Shield className="h-4 w-4" />
                      <span>Panel de Administración</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Módulo de Administración de Plantel - Solo para directores */}
        {isDirector && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración de Plantel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === "administracion-plantel"}
                    tooltip="Gestión de plantel educativo"
                  >
                    <button onClick={() => onSectionChange("administracion-plantel")} className="w-full">
                      <Users className="h-4 w-4" />
                      <span>Gestión de Plantel</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={() => onSectionChange("perfil")} className="w-full">
                <div className="flex items-center gap-2 px-2 py-2 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{user?.email ? getInitials(user.email) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <span className="text-sm font-medium truncate">{displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={() => onSectionChange("faq")} className="w-full">
                <HelpCircle className="h-4 w-4" />
                <span>Preguntas Frecuentes</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={handleSignOut} className="w-full text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
