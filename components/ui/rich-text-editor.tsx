"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Escribe aquí...", 
  className,
  disabled = false 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false, // Para evitar problemas de SSR
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editable: !disabled,
  })

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run()
  }, [editor])

  const setHeading = useCallback((level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run()
  }, [editor])

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run()
  }, [editor])

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Barra de herramientas */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleBold}
          disabled={disabled}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleItalic}
          disabled={disabled}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setHeading(1)}
          disabled={disabled}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setHeading(2)}
          disabled={disabled}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setHeading(3)}
          disabled={disabled}
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleBulletList}
          disabled={disabled}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleOrderedList}
          disabled={disabled}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleBlockquote}
          disabled={disabled}
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={disabled || !editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={disabled || !editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Área de edición */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none"
      />
    </div>
  )
}

// Función utilitaria para convertir markdown a HTML
export function convertMarkdownToHtml(content: string): string {
  if (!content) return ''
  
  // Verificar si ya es HTML válido (contiene tags HTML estructurales)
  const hasStructuralHtml = /<(p|div|h[1-6]|ul|ol|li|strong|em|br)\s*[^>]*>/i.test(content)
  if (hasStructuralHtml) {
    return content
  }
  
  let html = content
  
  // Convertir encabezados
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  
  // Convertir texto en negrita
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Convertir texto en cursiva (solo asteriscos simples que no sean parte de negritas)
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
  
  // Convertir listas no ordenadas
  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/((<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>')
  
  // Convertir listas ordenadas
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
  // Reemplazar las listas ordenadas que no fueron capturadas por las no ordenadas
  html = html.replace(/<ul>((\s*<li>.*<\/li>\s*)+)<\/ul>/g, (match, listItems) => {
    // Verificar si la lista original tenía números
    const originalLines = content.split('\n')
    const hasNumbers = originalLines.some(line => /^\s*\d+\.\s+/.test(line))
    return hasNumbers ? `<ol>${listItems}</ol>` : match
  })
  
  // Convertir citas
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
  
  // Convertir saltos de línea dobles en párrafos
  const paragraphs = html.split(/\n\s*\n/)
  html = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim()
    if (!trimmed) return ''
    
    // No envolver en <p> si ya tiene tags de bloque
    if (trimmed.match(/^<(h[1-6]|ul|ol|blockquote|div)/)) {
      return trimmed
    }
    
    // Convertir saltos de línea simples en <br>
    const withBreaks = trimmed.replace(/\n/g, '<br>')
    return `<p>${withBreaks}</p>`
  }).filter(p => p).join('')
  
  return html
}

// Función utilitaria para convertir contenido legacy a HTML
export function convertLegacyToHtml(content: string): string {
  if (!content) return ''
  
  // Si ya es HTML (contiene tags), devolverlo tal como está
  if (content.includes('<') && content.includes('>')) {
    return content
  }
  
  // Primero intentar convertir como markdown
  const markdownHtml = convertMarkdownToHtml(content)
  if (markdownHtml !== content) {
    return markdownHtml
  }
  
  // Fallback: convertir texto plano a HTML básico
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('')
}

// Función utilitaria para convertir HTML a texto plano (para compatibilidad legacy)
export function convertHtmlToPlainText(html: string): string {
  if (!html) return ''
  
  // Crear un elemento temporal para extraer el texto
  if (typeof window !== 'undefined') {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }
  
  // Fallback para SSR - remover tags HTML básicos
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}