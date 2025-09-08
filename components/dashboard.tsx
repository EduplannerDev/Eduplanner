"use client"

import { useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { DashboardHome } from "./sections/dashboard-home"
import { NuevaPlaneacion } from "./sections/nueva-planeacion"
import { MisPlaneaciones } from "./sections/mis-planeaciones"
import { Perfil } from "./sections/perfil"
import { ChatIA } from "./sections/chat-ia"
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

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [preselectedStudent, setPreselectedStudent] = useState<any>(null)
  const [selectedStudentForMessages, setSelectedStudentForMessages] = useState<any>(null)
  const { isDirector } = useRoles()

  const handleNavigateToMensajesPadres = (studentData: any) => {
    setPreselectedStudent(studentData)
    setActiveSection("generar-mensajes-padres")
  }

  const handleNavigateToMensajesPadresAlumno = (studentData: any) => {
    setSelectedStudentForMessages(studentData)
    setActiveSection("mensajes-padres-alumno")
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
      case "dosificacion":
        return "Dosificación"
      default:
        return "Dashboard"
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome onSectionChange={setActiveSection} />
      case "nueva-planeacion":
        return <NuevaPlaneacion onCreateClass={() => setActiveSection("chat-ia")} />
      case "mis-planeaciones":
        return <MisPlaneaciones onCreateNew={() => setActiveSection("chat-ia")} />
      case "perfil":
        return <Perfil />
      case "chat-ia":
        return <ChatIA onBack={() => setActiveSection("nueva-planeacion")} onSaveSuccess={() => setActiveSection("mis-planeaciones")} />
      case "examenes":
        return <Examenes />
      case "generar-examenes":
        return <GenerarExamen onBack={() => setActiveSection("nueva-planeacion")} onSaveSuccess={() => setActiveSection("examenes")} />
      case "generar-mensajes":
        return <GenerarMensajes onBack={() => setActiveSection("nueva-planeacion")} onNavigateToMessages={() => setActiveSection("mis-mensajes")} />
      case "generar-mensajes-padres":
        return <GenerarMensajesPadres 
          onBack={() => {
            setActiveSection("grupos")
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
      case "dosificacion":
        return <Dosificacion onCreateNew={() => setActiveSection("dosificacion")} />
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
            {!isChat && <WelcomeMessage />}
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
