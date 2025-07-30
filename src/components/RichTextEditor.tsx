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
    Search,
    Loader
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
    onFindTasks?: (selectedText: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ content, onChange, placeholder = "Start writing...", className = "", onFindTasks }, ref) => {
    const [hasSelection, setHasSelection] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchDuration, setSearchDuration] = useState(0);

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
                class: 'focus:outline-none h-full',
            },
            handleKeyDown: () => {
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

    // Timer effect for search duration
    useEffect(() => {
        let interval: number;
        if (isSearching) {
            interval = setInterval(() => {
                setSearchDuration(prev => prev + 1);
            }, 1000);
        } else {
            setSearchDuration(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isSearching]);

    // Handle task finding with loading state
    const handleTaskSearch = () => {
        if (!onFindTasks || isSearching) return;

        const textToAnalyze = hasSelection ? selectedText : editor.getText();
        setIsSearching(true);

        // Use requestAnimationFrame + setTimeout to ensure UI updates before heavy computation
        requestAnimationFrame(() => {
            setTimeout(async () => {
                try {
                    await onFindTasks(textToAnalyze);
                } finally {
                    setIsSearching(false);
                }
            }, 10); // Small delay to ensure UI renders
        });
    };

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
                : 'text-dark-700 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-800 hover:text-dark-950 dark:hover:text-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    return (
        <div className={`border border-dark-400 dark:border-dark-700 rounded-lg overflow-hidden flex flex-col ${className}`}>
            {/* Toolbar */}
            <div className="border-b border-dark-300 dark:border-dark-700 bg-dark-100 dark:bg-dark-800 p-2 flex flex-wrap gap-1 transition-colors">
                {/* Text Formatting */}
                <div className="flex items-center gap-1 pr-2 border-r border-dark-400 dark:border-dark-700">
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
                <div className="flex items-center gap-1 pr-2 border-r border-dark-400 dark:border-dark-700">
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
                <div className="flex items-center gap-1 pr-2 border-r border-dark-400 dark:border-dark-700">
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

                {/* Task Finding - Native toolbar button */}
                {onFindTasks && (
                    <div className="flex items-center gap-1 pl-2 border-l border-dark-400 dark:border-dark-700">
                        <ToolbarButton
                            onClick={handleTaskSearch}
                            disabled={isSearching}
                            title={isSearching
                                ? `Searching... ${searchDuration}s`
                                : hasSelection
                                    ? "Find Tasks in Selection"
                                    : "Find Tasks in Entire Note"
                            }
                        >
                            {isSearching ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                        </ToolbarButton>
                        {isSearching && (
                            <span className="text-xs text-dark-600 dark:text-dark-400 ml-1 tabular-nums">
                                {searchDuration}s
                            </span>
                        )}
                    </div>
                )}
            </div>


            {/* Editor */}
            <div className="flex-1 bg-white dark:bg-dark-900 transition-colors overflow-hidden">
                <EditorContent
                    editor={editor}
                    className="h-full overflow-y-auto focus-within:ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400"
                />
            </div>
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
