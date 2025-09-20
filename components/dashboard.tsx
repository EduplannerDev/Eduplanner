"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { DashboardHome } from "./sections/dashboard-home"
import { NuevaPlaneacion } from "./sections/nueva-planeacion"
import { MisPlaneaciones } from "./sections/mis-planeaciones"
import { Perfil } from "./sections/perfil"
import { ChatIA } from "./sections/chat-ia"
import { ChatIADosificacion } from "./sections/chat-ia-dosificacion"
import Examenes from "./sections/examenes"
import GenerarExamen from "./sections/generar-examen"
import { GenerarMensajes } from "./sections/generar-mensajes"
import { GenerarMensajesPadres } from "./sections/generar-mensajes-padres"
import { MisMensajes } from "./sections/mis-mensajes"
import { MensajesPadresAlumno } from "./sections/mensajes-padres-alumno"
import { FAQ } from "./sections/faq"
import MisGrupos from "./sections/mis-grupos"
import { AdminDashboard } from "./sections/admin-dashboard"
import { AdministracionPlantel } from "./sections/administracion-plantel"
import { Agenda } from "./sections/agenda"
import { DiarioProfesional } from "./sections/diario-profesional"
import TomarAsistencia from "./sections/tomar-asistencia"
import EnvioCorreos from "./sections/envio-correos"
import { Dosificacion } from "./sections/dosificacion"
import { BetaTestersAdmin } from "./sections/beta-testers-admin"
import { BetaFeaturesDemo } from "./sections/beta-features-demo"
import { ListaProyectos } from "./sections/lista-proyectos"
import { ProyectoWizard } from "./sections/proyecto-wizard"
import { WelcomeMessage } from "./ui/welcome-message"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useRoles } from "@/hooks/use-roles"

interface DashboardProps {
  children?: React.ReactNode
  customContent?: boolean
}

export default function Dashboard({ children, customContent = false }: DashboardProps = {}) {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState("dashboard")

  // Leer parámetro de sección de la URL para proyectos (mantener compatibilidad)
  useEffect(() => {
    const section = searchParams.get('section')
    if (section === 'proyectos' || section === 'crear-proyecto') {
      setActiveSection(section)
    }
  }, [searchParams])
  const [preselectedStudent, setPreselectedStudent] = useState<any>(null)
  const [selectedStudentForMessages, setSelectedStudentForMessages] = useState<any>(null)
  const [initialChatMessage, setInitialChatMessage] = useState<string>("")
  const [dosificacionData, setDosificacionData] = useState<{
    contenidos: any[]
    contexto: any
    mesActual: string
  } | null>(null)
  const [previousSection, setPreviousSection] = useState<string>("grupos")
  const { isDirector } = useRoles()

  const handleNavigateToMensajesPadres = (studentData: any) => {
    setPreviousSection(activeSection) // Guardar la sección actual antes de navegar
    setPreselectedStudent(studentData)
    setActiveSection("generar-mensajes-padres")
  }

  const handleNavigateToMensajesPadresAlumno = (studentData: any) => {
    setSelectedStudentForMessages(studentData)
    setActiveSection("mensajes-padres-alumno")
  }

  const handleNavigateToChatWithMessage = (message: string) => {
    clearChatStates() // Limpiar estados previos
    setInitialChatMessage(message)
    setActiveSection("chat-ia")
  }

  const handleNavigateToChatDosificacion = (data: {
    contenidos: any[]
    contexto: any
    mesActual: string
    message: string
  }) => {
    clearChatStates() // Limpiar estados previos
    setDosificacionData({
      contenidos: data.contenidos,
      contexto: data.contexto,
      mesActual: data.mesActual
    })
    setInitialChatMessage(data.message)
    setActiveSection("chat-ia-dosificacion")
  }

  // Función para limpiar todos los estados de chat
  const clearChatStates = () => {
    setInitialChatMessage("")
    setDosificacionData(null)
  }

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "dashboard":
        return "Dashboard"
      case "nueva-planeacion":
        return "Nueva Planeación"
      case "mis-planeaciones":
        return "Mis Planeaciones"
      case "perfil":
        return "Perfil"
      case "chat-ia":
        return "Crear Planeaciones con IA"
      case "chat-ia-dosificacion":
        return "Planeación desde Dosificación"
      case "examenes":
        return "Mis Exámenes"
      case "generar-examenes":
        return "Generar Exámenes"
      case "generar-mensajes":
        return "Generar Mensajes"
      case "generar-mensajes-padres":
        return "Generar Mensajes para Padres"
      case "mensajes-padres-alumno":
        return "Mensajes para Padres"
      case "mis-mensajes":
        return "Mis Mensajes"

      case "faq":
        return "Preguntas Frecuentes"
      case "grupos":
        return "Mis Grupos"
      case "agenda":
        return "Agenda"
      case "tomar-asistencia":
        return "Tomar Asistencia"
      case "bitacora":
        return "Bitácora"
      case "admin-dashboard":
        return "Panel de Administración"
      case "administracion-plantel":
        return "Administración de Plantel"
      case "envio-correos":
        return "Envío de Correos"
      case "beta-testers":
        return "Beta Testers"
      case "beta-features":
        return "Funcionalidades Beta"
      case "dosificacion":
        return "Dosificación"
      case "proyectos":
        return "Proyectos"
      default:
        return "Dashboard"
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome onSectionChange={setActiveSection} />
      case "nueva-planeacion":
        return <NuevaPlaneacion 
          onCreateClass={() => {
            clearChatStates()
            setActiveSection("chat-ia")
          }} 
          onNavigateToChatWithMessage={handleNavigateToChatWithMessage}
          onNavigateToChatDosificacion={handleNavigateToChatDosificacion}
        />
      case "mis-planeaciones":
        return <MisPlaneaciones onCreateNew={() => {
          clearChatStates()
          setActiveSection("chat-ia")
        }} />
      case "perfil":
        return <Perfil />
      case "chat-ia":
        return <ChatIA 
          onBack={() => {
            setActiveSection("nueva-planeacion")
            clearChatStates()
          }} 
          onSaveSuccess={() => {
            setActiveSection("mis-planeaciones")
            clearChatStates()
          }}
          initialMessage={initialChatMessage}
        />
      case "chat-ia-dosificacion":
        return dosificacionData ? <ChatIADosificacion 
          onBack={() => {
            setActiveSection("nueva-planeacion")
            clearChatStates()
          }} 
          onSaveSuccess={() => {
            setActiveSection("mis-planeaciones")
            clearChatStates()
          }}
          initialMessage={initialChatMessage}
          contenidosSeleccionados={dosificacionData.contenidos}
          contexto={dosificacionData.contexto}
          mesActual={dosificacionData.mesActual}
        /> : null
      case "examenes":
        return <Examenes />
      case "generar-examenes":
        return <GenerarExamen onBack={() => setActiveSection("nueva-planeacion")} onSaveSuccess={() => setActiveSection("examenes")} />
      case "generar-mensajes":
        return <GenerarMensajes onBack={() => setActiveSection("nueva-planeacion")} onNavigateToMessages={() => setActiveSection("mis-mensajes")} />
      case "generar-mensajes-padres":
        return <GenerarMensajesPadres 
          onBack={() => {
            setActiveSection(previousSection)
            setPreselectedStudent(null)
          }} 
          onNavigateToMessages={() => setActiveSection("mis-mensajes")} 
          preselectedStudent={preselectedStudent}
        />
      case "mis-mensajes":
        return <MisMensajes onCreateNew={() => setActiveSection("generar-mensajes")} />
      case "mensajes-padres-alumno":
        return <MensajesPadresAlumno 
          onBack={() => {
            setActiveSection("grupos")
            setSelectedStudentForMessages(null)
          }}
          studentId={selectedStudentForMessages?.id || ""}
          studentName={selectedStudentForMessages?.nombre || ""}
        />
      case "faq":
        return <FAQ />
      case "grupos":
        return <MisGrupos 
          onNavigateToMensajesPadres={handleNavigateToMensajesPadres} 
          onNavigateToMensajesPadresAlumno={handleNavigateToMensajesPadresAlumno}
        />
      case "agenda":
        return <Agenda onSectionChange={setActiveSection} />
      case "tomar-asistencia":
        return <TomarAsistencia onBack={() => setActiveSection("dashboard")} />
      case "bitacora":
        return <DiarioProfesional isOpen={true} onClose={() => setActiveSection("agenda")} />
      case "admin-dashboard":
        return <AdminDashboard />
      case "administracion-plantel":
        // Validar que solo los directores puedan acceder
        if (!isDirector) {
          // Redirigir al dashboard si no es director
          setActiveSection("dashboard")
          return <DashboardHome onSectionChange={setActiveSection} />
        }
        return <AdministracionPlantel isOpen={true} onClose={() => setActiveSection("admin-dashboard")} />
      case "envio-correos":
        return <EnvioCorreos />
      case "beta-testers":
        return <BetaTestersAdmin />
      case "beta-features":
        return <BetaFeaturesDemo />
      case "dosificacion":
        return <Dosificacion 
          onCreateNew={() => setActiveSection("dosificacion")} 
          onNavigateToChatDosificacion={handleNavigateToChatDosificacion}
        />
      case "proyectos":
        return <ListaProyectos />
      case "crear-proyecto":
        return <ProyectoWizard onComplete={() => setActiveSection("proyectos")} />
      default:
        return <DashboardHome onSectionChange={setActiveSection} />
    }
  }

  // Usar padding diferente para el chat y mensajes
  const isChat = activeSection === "generar-mensajes-padres"

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">EduPlanner</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{getSectionTitle(activeSection)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className={`flex flex-1 flex-col ${isChat ? "h-[calc(100vh-4rem)]" : "gap-4 p-4 pt-4"}`}>
          <div
            className={isChat ? "flex-1 h-full p-4" : "min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6"}
          >
            {!isChat && !customContent && <WelcomeMessage />}
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
