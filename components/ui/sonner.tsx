"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-green-500 !bg-green-50 !text-green-900 dark:!border-green-800 dark:!bg-green-950 dark:!text-green-100",
          error:
            "!border-red-500 !bg-red-50 !text-red-900 dark:!border-red-800 dark:!bg-red-950 dark:!text-red-100",
          warning:
            "!border-yellow-500 !bg-yellow-50 !text-yellow-900 dark:!border-yellow-800 dark:!bg-yellow-950 dark:!text-yellow-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
