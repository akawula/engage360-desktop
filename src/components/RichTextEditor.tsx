import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Heading3,
    CheckSquare
} from 'lucide-react';

export interface RichTextEditorRef {
    getContent: () => string;
    getSelectedText: () => string;
}

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    onCreateActionItem?: (selectedText: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ content, onChange, placeholder = "Start writing...", className = "", onCreateActionItem }, ref) => {
    const [hasSelection, setHasSelection] = useState(false);
    const [selectedText, setSelectedText] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection;
            const selection = editor.state.doc.textBetween(from, to, ' ').trim();
            setSelectedText(selection);
            setHasSelection(selection.length > 0);
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none min-h-[300px]',
            },
            handleKeyDown: (view, event) => {
                // Handle Cmd+Shift+A
                if (event.metaKey && event.shiftKey && event.key === 'A') {
                    event.preventDefault();

                    if (onCreateActionItem) {
                        const { from, to } = view.state.selection;
                        const selectedText = view.state.doc.textBetween(from, to, ' ').trim();
                        onCreateActionItem(selectedText);
                    }
                    return true;
                }
                return false;
            },
        },
        onCreate: () => {
            // Editor initialized successfully
        },
    });

    useImperativeHandle(ref, () => ({
        getContent: () => {
            if (!editor) return '';

            // Get the current content from the editor
            const currentContent = editor.getHTML();
            return currentContent;
        },
        getSelectedText: () => {
            if (!editor) return '';

            // Get the current text selection
            const { from, to } = editor.state.selection;
            if (from === to) return ''; // No selection

            // Get the selected text
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            return selectedText.trim();
        }
    }));

    // Update editor content when the content prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-colors ${isActive
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    return (
        <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1 transition-colors">
                {/* Text Formatting */}
                <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Headings */}
                <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* History */}
                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                {/* Action Item Creation - Only show when text is selected */}
                {hasSelection && onCreateActionItem && (
                    <div className="flex items-center gap-1 pl-2 border-l border-gray-300 dark:border-gray-600">
                        <button
                            type="button"
                            onClick={() => onCreateActionItem(selectedText)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors"
                            title="Create Action Item from Selection (Cmd+Shift+A)"
                        >
                            <CheckSquare className="w-4 h-4" />
                            Create Action Item
                        </button>
                    </div>
                )}
            </div>

            {/* Helpful hint for action item creation */}
            {onCreateActionItem && (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    💡 Tip: Select text and press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Cmd+Shift+A</kbd> or use the button above to create an action item
                </div>
            )}

            {/* Editor */}
            <div className="bg-white dark:bg-gray-800 transition-colors">
                <EditorContent
                    editor={editor}
                    className="min-h-[400px] max-h-[600px] overflow-y-auto focus-within:ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400"
                />
            </div>
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
