'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
    Bold, Italic, Underline as UnderlineIcon,
    Heading1, Heading2, Pilcrow,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered
} from 'lucide-react'

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
}

function ToolbarButton({ active, onClick, children, title }: {
    active?: boolean; onClick: () => void; children: React.ReactNode; title: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                active
                    ? 'bg-[#0077B6] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
        >
            {children}
        </button>
    )
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[160px] px-4 py-3 text-slate-800',
            },
        },
    })

    if (!editor) return null

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                {/* Text style */}
                <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Headings */}
                <ToolbarButton
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    title="Heading 1"
                >
                    <Heading1 size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('paragraph')}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    title="Paragraph"
                >
                    <Pilcrow size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Alignment */}
                <ToolbarButton
                    active={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                {/* Lists */}
                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </ToolbarButton>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    )
}
