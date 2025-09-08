"use client"

import type React from "react";
import { useState } from "react";

import { FileText, User, LogOut, GraduationCap, Plus, MessageSquare, HelpCircle, Users, BookOpen, Calendar, Bot, Shield, Home, ChevronDown, ChevronRight, Notebook, Mail } from "lucide-react"

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserData } from "@/hooks/use-user-data"
import { useRoles } from "@/hooks/use-roles"
import { useIsMobile } from "@/hooks/use-mobile"

// Estructura del menú con secciones desplegables
const menuStructure = {
  planificacionEvaluacion: {
    title: "PLANIFICACIÓN Y EVALUACIÓN",
    description: "Herramientas para crear y gestionar planeaciones didácticas y evaluaciones",
    sections: [
      {
        title: "Planeaciones",
        icon: FileText,
        items: [
          {
            title: "Crear Nueva",
            url: "#nueva-planeacion",
            description: "Te lleva al hub de creación",
          },
          {
            title: "Mis Planeaciones",
            url: "#mis-planeaciones",
            description: "Te lleva a la lista",
          },
        ],
      },
      {
        title: "Exámenes",
        icon: GraduationCap,
        items: [
          {
            title: "Generar Examen",
            url: "#generar-examenes",
            description: "Te lleva al generador",
          },
          {
            title: "Mis Exámenes",
            url: "#examenes",
            description: "Te lleva a la lista",
          },
        ],
      },
    ],
  },
  gestionAula: {
    title: "GESTIÓN DEL AULA",
    description: "Administración de grupos estudiantiles y comunicación",
    sections: [
      {
        title: "Mis Grupos",
        icon: Users,
        url: "#grupos",
        description: "Gestión de grupos estudiantiles",
      },
      {
        title: "Mensajes",
        icon: MessageSquare,
        url: "#mis-mensajes",
        description: "Ver y gestionar mensajes",
      },
    ],
  },
  miEspacio: {
    title: "MI ESPACIO",
    description: "Herramientas personales y organización",
    sections: [
      {
        title: "Agenda",
        icon: Calendar,
        url: "#agenda",
        description: "Gestionar tu agenda personal",
      },
      {
        title: "Bitácora",
        icon: Notebook,
        url: "#bitacora",
        description: "Registro de actividades y observaciones",
      },
    ],
  },
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange, ...props }: AppSidebarProps) {
  const { user, signOut } = useAuth()
  const { userData } = useUserData(user?.id)
  const { isAdmin, isDirector } = useRoles()
  const { state, setOpenMobile } = useSidebar()
  const isMobile = useIsMobile()
  
  // Estado para manejar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    planeaciones: false,
    examenes: false,
    mensajes: false,
  })

  const handleSignOut = async () => {
    await signOut()
    // No necesitamos cerrar el sidebar aquí ya que se redirige al login
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }
  
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Función para manejar la navegación y cerrar el sidebar en móvil
  const handleNavigation = (section: string) => {
    onSectionChange(section)
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Obtener el nombre para mostrar
  const displayName = user?.user_metadata?.full_name || userData?.full_name || "Profesor"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className={`border-b border-sidebar-border ${state === "expanded" ? "p-4" : "p-2"}`}>
        {/* --- Logo y Texto Alineados Horizontalmente --- */}
        <div className="flex flex-row items-center justify-center gap-3">
          {/* Logo siempre visible */}
          <img 
            src="/images/Logo.png" 
            alt="Logo EduPlanner" 
            className={`w-auto ${state === "expanded" ? "h-10" : "h-8"}`} 
          />
          {/* Texto solo visible cuando está expandido */}
          {state === "expanded" && (
            <div className="text-left">
              <span className="block text-sm font-semibold">EduPlanner</span>
              <span className="block text-xs text-muted-foreground">Planeaciones con IA</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard como opción independiente */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeSection === "dashboard"}
                  tooltip="Panel principal con resumen de actividades"
                >
                  <button onClick={() => handleNavigation("dashboard")} className="w-full">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* PLANIFICACIÓN Y EVALUACIÓN */}
        <SidebarGroup>
          {state === "expanded" && (
            <SidebarGroupLabel>{menuStructure.planificacionEvaluacion.title}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuStructure.planificacionEvaluacion.sections.map((section) => (
                <SidebarMenuItem key={section.title}>
                  {section.items ? (
                    state === "expanded" ? (
                      <Collapsible
                        open={expandedSections[section.title.includes('Planeaciones') ? 'planeaciones' : 'examenes']}
                        onOpenChange={() => toggleSection(section.title.includes('Planeaciones') ? 'planeaciones' : 'examenes')}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <section.icon className="h-4 w-4" />
                            <span>{section.title}</span>
                            {expandedSections[section.title.includes('Planeaciones') ? 'planeaciones' : 'examenes'] ? (
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            ) : (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {section.items.map((item) => (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={activeSection === item.url.replace("#", "")}
                                >
                                  <button onClick={() => handleNavigation(item.url.replace("#", ""))} className="w-full">
                                    <span>{item.title}</span>
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <SidebarMenuButton
                            tooltip={section.title}
                          >
                            <section.icon className="h-4 w-4" />
                          </SidebarMenuButton>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="w-48 p-2">
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <button
                                key={item.title}
                                onClick={() => handleNavigation(item.url.replace("#", ""))}
                                className="w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                              >
                                {item.title}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  ) : (
                     <SidebarMenuButton
                       asChild
                       isActive={activeSection === (section as any).url?.replace("#", "")}
                       tooltip={(section as any).description}
                     >
                       <button onClick={() => handleNavigation((section as any).url?.replace("#", "") || "")} className="w-full">
                         <section.icon className="h-4 w-4" />
                         <span>{section.title}</span>
                       </button>
                     </SidebarMenuButton>
                   )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* GESTIÓN DEL AULA */}
        <SidebarGroup>
          {state === "expanded" && (
            <SidebarGroupLabel>{menuStructure.gestionAula.title}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuStructure.gestionAula.sections.map((section) => (
                <SidebarMenuItem key={section.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === (section as any).url?.replace("#", "")}
                    tooltip={(section as any).description}
                  >
                    <button onClick={() => handleNavigation((section as any).url?.replace("#", "") || "")} className="w-full">
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* MI ESPACIO */}
        <SidebarGroup>
          {state === "expanded" && (
            <SidebarGroupLabel>{menuStructure.miEspacio.title}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuStructure.miEspacio.sections.map((section) => (
                <SidebarMenuItem key={section.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === section.url?.replace("#", "")}
                    tooltip={section.description}
                  >
                    <button onClick={() => handleNavigation(section.url?.replace("#", "") || "")} className="w-full">
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
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
            {state === "expanded" && (
              <SidebarGroupLabel>Administración Global</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === "admin-dashboard"}
                    tooltip="Panel de administración del sistema"
                  >
                    <button onClick={() => handleNavigation("admin-dashboard")} className="w-full">
                      <Shield className="h-4 w-4" />
                      <span>Panel de Administración</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === "envio-correos"}
                    tooltip="Enviar correos personalizados desde contacto@eduplanner.mx"
                  >
                    <button onClick={() => handleNavigation("envio-correos")} className="w-full">
                      <Mail className="h-4 w-4" />
                      <span>Envío de Correos</span>
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
            {state === "expanded" && (
              <SidebarGroupLabel>Administración de Plantel</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === "administracion-plantel"}
                    tooltip="Gestión de plantel educativo"
                  >
                    <button onClick={() => handleNavigation("administracion-plantel")} className="w-full">
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
              <button onClick={() => handleNavigation("perfil")} className="w-full">
                {state === "collapsed" ? (
                  <div className="flex items-center justify-center w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{user?.email ? getInitials(user.email) : "U"}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
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
                )}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={state === "collapsed" ? "Preguntas Frecuentes" : undefined}>
              <button onClick={() => handleNavigation("faq")} className="w-full">
                <HelpCircle className="h-4 w-4" />
                {state === "expanded" && <span>Preguntas Frecuentes</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={state === "collapsed" ? "Cerrar Sesión" : undefined}>
              <button onClick={handleSignOut} className="w-full text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" />
                {state === "expanded" && <span>Cerrar Sesión</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
