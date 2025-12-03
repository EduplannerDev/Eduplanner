"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    placeholder?: string
    tags: string[]
    setTags: (tags: string[]) => void
    className?: string
}

export function TagInput({
    placeholder,
    tags,
    setTags,
    className,
    ...props
}: TagInputProps) {
    const [inputValue, setInputValue] = React.useState("")

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addTag()
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1)
        }
    }

    const addTag = () => {
        const trimmedInput = inputValue.trim()
        if (trimmedInput && !tags.includes(trimmedInput)) {
            setTags([...tags, trimmedInput])
            setInputValue("")
        }
    }

    const removeTag = (index: number) => {
        const newTags = [...tags]
        newTags.splice(index, 1)
        setTags(newTags)
    }

    return (
        <div className={cn("flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
            {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => removeTag(index)}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-[120px]"
                {...props}
            />
        </div>
    )
}
