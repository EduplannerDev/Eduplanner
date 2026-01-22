"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, X, Zap, Star, AlertTriangle, CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { subscribestripe, simulateWebhookInDevelopment } from "@/hooks/stripe"
import { useTransition } from "react"
import { startTransition } from 'react';
import { getSubscriptionInfo, isUserPro } from "@/lib/subscription-utils"
import { useNotification } from "@/hooks/use-notification"
import { useState, useEffect } from "react"


interface SubscriptionCardProps {
  userPlan: "free" | "pro"
}

export function SubscriptionCard({ userPlan }: SubscriptionCardProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { success, error: showError, warning } = useNotification()
  const email: string = user?.email || ""
  const userId: string = user?.id || ""
  const isPro = profile ? isUserPro(profile) : userPlan === "pro"
  const subscriptionInfo = profile ? getSubscriptionInfo(profile) : null
  const [isPending, startTransition] = useTransition()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly')

  // Detectar cuando regresa del pago en desarrollo
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const pendingUserId = localStorage.getItem('pendingSubscriptionUserId');
      if (pendingUserId && pendingUserId === userId) {
        simulateWebhookInDevelopment(userId);
        localStorage.removeItem('pendingSubscriptionUserId');
      }
    }
  }, [userId]);
  const handleClickSubsButton = async () => {
    const url = await subscribestripe({ userId, email, plan: selectedPlan });

    if (url) {
      window.location.href = url;
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    setShowCancelModal(false);

    startTransition(async () => {
      try {
        const response = await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cancelar la suscripción');
        }

        success('Suscripción cancelada', {
          title: '¡Listo!',
          description: 'Tu suscripción ha sido cancelada. Seguirás teniendo acceso a las funciones premium hasta el final del período de facturación.'
        });

        // Refrescar el perfil para mostrar el nuevo estado
        if (profile) {
          // Aquí podrías llamar a refreshProfile si está disponible
          window.location.reload(); // Por ahora recargamos la página
        }
      } catch (error: any) {
        showError('Error al cancelar suscripción', {
          title: 'Error',
          description: error.message || 'No se pudo cancelar la suscripción. Por favor, intenta de nuevo más tarde.'
        });
      }
    });
  };


  // Características de los planes

  const freeFeatures = [
    { name: "3 planeaciones por mes", included: true },
    { name: "10 mensajes por día", included: true },
    { name: "Exámenes ilimitados", included: true },
    { name: "5 fichas descriptivas con IA", included: true },
    { name: "1 grupo", included: true },
    { name: "1 proyecto", included: true },
    { name: "Descarga en formato PDF", included: true }
  ]

  const proFeatures = [
    { name: "Todo lo del plan Gratis, más:", included: true },
    { name: "Plan Analítico NMCM 2023", included: true },
    { name: "Planeaciones CIME con IA", included: true },
    { name: "Planeaciones con Uso Profesional", included: true },
    { name: "Mensajes con Uso Profesional", included: true },
    { name: "Fichas Descriptivas con Uso Profesional", included: true },
    { name: "Grupos con Uso Profesional", included: true },
    { name: "Proyectos con Uso Profesional", included: true },
    { name: "Descarga en formato Word (.docx) editable", included: true },
    { name: "Soporte prioritario", included: true },
  ]


  return (
    <div className="space-y-6 mx-auto">
      {/* Plan Actual */}
      <Card className={isPro ? "bg-muted/50 border-border" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro ? <Crown className="h-5 w-5 text-foreground" /> : <Zap className="h-5 w-5 text-blue-600" />}
              <CardTitle className="text-foreground">Plan Actual</CardTitle>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-foreground text-background" : ""}>
              {isPro ? "PRO" : "FREE"}
            </Badge>
          </div>
          <CardDescription>
            {isPro
              ? "Tienes acceso completo a todas las funciones premium"
              : "Estás usando el plan gratuito con funciones limitadas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {isPro ? "$200" : "$0"}
                <span className="text-sm font-normal text-gray-600">{isPro ? "/mes" : ""}</span>
              </span>
              {isPro && subscriptionInfo && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {subscriptionInfo.cancelAtPeriodEnd ? 'Finaliza el' : 'Próxima facturación'}
                  </p>
                  <p className="font-medium">
                    {subscriptionInfo.cancelAtPeriodEnd && subscriptionInfo.endDate ?
                      subscriptionInfo.endDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                      : subscriptionInfo.renewDate ?
                        subscriptionInfo.renewDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'No disponible'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Funciones incluidas:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {(isPro ? proFeatures : freeFeatures).slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              {!isPro && (
                <div className="w-full max-w-md space-y-4">
                  {/* Selector de Plan */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setSelectedPlan('monthly')}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${selectedPlan === 'monthly'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Mensual
                      <div className="text-xs mt-1 font-bold">$200/mes</div>
                    </button>
                    <button
                      onClick={() => setSelectedPlan('annual')}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors relative ${selectedPlan === 'annual'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Anual
                      <div className="text-xs mt-1 font-bold">$1,990/año</div>
                      <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-1 py-0">
                        Ahorra $410
                      </Badge>
                    </button>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => handleClickSubsButton()}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Actualizar a PRO {selectedPlan === 'annual' ? '(Anual)' : '(Mensual)'}
                  </Button>
                </div>
              )}

              {isPro && subscriptionInfo && (
                <div className="flex flex-col gap-2 mt-4">
                  {subscriptionInfo.status === 'cancelling' || subscriptionInfo.cancelAtPeriodEnd ? (
                    <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md mb-2 text-center">
                      <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                      Tu suscripción finalizará el {subscriptionInfo.endDate ?
                        subscriptionInfo.endDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'N/A'
                      }.
                    </div>
                  ) : subscriptionInfo.status === 'cancelled' ? (
                    <div className="text-sm text-red-600 p-2 bg-red-50 rounded-md mb-2 text-center">
                      <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                      Tu suscripción ha sido cancelada.
                    </div>
                  ) : subscriptionInfo.status === 'past_due' ? (
                    <div className="text-sm text-orange-600 p-2 bg-orange-50 rounded-md mb-2 text-center">
                      <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                      Tu suscripción tiene pagos pendientes.
                    </div>
                  ) : subscriptionInfo.isActive && !subscriptionInfo.cancelAtPeriodEnd && subscriptionInfo.stripeSubscriptionId ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleCancelSubscription}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar Plan
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparación de Planes */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 dark:text-gray-100">
            <Star className="h-5 w-5" />
            Comparación de Planes
          </CardTitle>
          <CardDescription className="dark:text-gray-300">Ve todas las funciones disponibles en cada plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Free */}
            <div className="space-y-4 text-center">
              <div>
                <h3 className="text-xl font-semibold dark:text-gray-100">Plan GRATIS</h3>
                <p className="text-3xl font-bold mt-2 dark:text-gray-100">
                  $0<span className="text-lg font-normal dark:text-gray-300"> / por siempre</span>
                </p>
              </div>
              <div className="space-y-3 text-left">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>{feature.name}</span>
                  </div>
                ))}
              </div>
              {!isPro && (
                <div className="pt-4">
                  <Badge variant="outline" className="w-full py-2">
                    Plan Actual
                  </Badge>
                </div>
              )}
            </div>

            {/* Plan Pro */}
            <div className="space-y-4 text-center border rounded-lg p-6 bg-muted/50 border-border relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-foreground text-background">Más Popular</Badge>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-6 w-6 text-foreground" />
                  <h3 className="text-xl font-semibold text-foreground">Plan PRO</h3>
                </div>
                <p className="text-3xl font-bold mt-2 text-foreground">
                  $200<span className="text-lg font-normal text-muted-foreground"> / mes</span>
                </p>
              </div>
              <div className="space-y-3 text-left">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-foreground">{feature.name}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                {isPro ? (
                  <Badge className="w-full py-2 bg-foreground text-background">Plan Actual</Badge>
                ) : (
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Actualizar a PRO
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancelar Suscripción
                </h3>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium al final del período de facturación.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelSubscription}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Sí, cancelar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
