"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, X, Zap, Star, AlertTriangle, CreditCard, Loader2 } from "lucide-react"
import { usePlaneaciones } from "@/hooks/use-planeaciones"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { subscribestripe } from "@/hooks/stripe"
import { useTransition } from "react"
import { startTransition } from 'react';
import { getSubscriptionInfo, isUserPro } from "@/lib/subscription-utils"


interface SubscriptionCardProps {
  userPlan: "free" | "pro"
}

export function SubscriptionCard({ userPlan }: SubscriptionCardProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const email: string = user?.email || ""
  const userId: string = user?.id || ""
  const isPro = profile ? isUserPro(profile) : userPlan === "pro"
  const { monthlyCount, getRemainingPlaneaciones } = usePlaneaciones()
  const subscriptionInfo = profile ? getSubscriptionInfo(profile) : null

  const remainingPlaneaciones = getRemainingPlaneaciones()
  const planeacionesLimit = isPro ? "∞" : 5
  const planeacionesProgress = isPro ? 0 : (monthlyCount / Number(planeacionesLimit)) * 100
  const [isPending, startTransition] = useTransition()
  const handleClickSubsButton = async () => {
    const url = await subscribestripe({ userId, email });
    
    if (url) {
      window.location.href = url;
    } else {
      console.error("No se pudo crear la sesión de Stripe.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium al final del período de facturación.")) {
      return;
    }
    
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
          throw new Error('Error al cancelar la suscripción');
        }
        
        alert('Tu suscripción ha sido cancelada. Seguirás teniendo acceso a las funciones premium hasta el final del período de facturación.');
        // Aquí podrías recargar la página o actualizar el estado
      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cancelar la suscripción. Por favor, intenta de nuevo más tarde.');
      }
    });
  };


  // Características de los planes

  const freeFeatures = [
    { name: "Hasta 5 planeaciones por mes", included: true },
    { name: "Plantillas básicas", included: true },
    { name: "Exportar en PDF", included: true },
    { name: "Soporte por email", included: false },
    { name: "Plantillas premium", included: false },
    { name: "Planeaciones ilimitadas", included: false },
    { name: "Colaboración en tiempo real", included: false },
    { name: "Análisis y reportes", included: false },
  ]

  const proFeatures = [
    { name: "Planeaciones ilimitadas", included: true },
    { name: "Todas las plantillas premium", included: true },
    { name: "Exportar en múltiples formatos", included: true },
    { name: "Soporte prioritario", included: true },
    { name: "Colaboración en tiempo real", included: true },
    { name: "Análisis y reportes avanzados", included: true },
    { name: "Banco de recursos educativos", included: true },
  ]


  return (
    <div className="space-y-6 mx-auto">
      {/* Plan Actual */}
      <Card className={isPro ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro ? <Crown className="h-5 w-5 text-yellow-600" /> : <Zap className="h-5 w-5 text-blue-600" />}
              <CardTitle className="dark:text-gray-100">Plan Actual</CardTitle>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-yellow-600" : ""}>
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
                <Button className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleClickSubsButton()}>
                  <Crown className="mr-2 h-4 w-4" />
                  Actualizar a PRO
                </Button>
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
                  ) : subscriptionInfo.isActive && !subscriptionInfo.cancelAtPeriodEnd ? (
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
                <h3 className="text-xl font-semibold dark:text-gray-100">Plan Free</h3>
                <p className="text-3xl font-bold mt-2 dark:text-gray-100">
                  $0<span className="text-lg font-normal dark:text-gray-300">/mes</span>
                </p>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">Perfecto para empezar</p>
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
            <div className="space-y-4 text-center border rounded-lg p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-600">Más Popular</Badge>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-xl font-semibold dark:text-gray-100">Plan PRO</h3>
                </div>
                <p className="text-3xl font-bold mt-2 dark:text-gray-100">
                  $200<span className="text-lg font-normal dark:text-gray-300">/mes</span>
                </p>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">Para profesores profesionales</p>
              </div>
              <div className="space-y-3 text-left">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{feature.name}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                {isPro ? (
                  <Badge className="w-full py-2 bg-yellow-600">Plan Actual</Badge>
                ) : (
                  <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Actualizar a PRO
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de Uso */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="dark:text-gray-100">Uso del Plan</CardTitle>
          <CardDescription className="dark:text-gray-300">Tu consumo actual del mes</CardDescription>
        </CardHeader>
        <CardContent className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Planeaciones creadas este mes</span>
                <span className="font-medium">
                  {monthlyCount} de {planeacionesLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${isPro ? "bg-green-600" : "bg-blue-600"}`}
                  style={{ width: `${planeacionesProgress}%` }}
                ></div>
              </div>
            </div>

            {!isPro && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Plantillas premium usadas</span>
                  <span className="font-medium">0 de 0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gray-400 h-3 rounded-full" style={{ width: "0%" }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Actualiza a PRO para acceder a plantillas premium
                </p>
              </div>
            )}

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Exportaciones realizadas</span>
                <span className="font-medium">{isPro ? "8 de ∞" : "2 de 10"}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${isPro ? "bg-green-600" : "bg-blue-600"}`}
                  style={{ width: isPro ? "8%" : "20%" }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
