"use client";

import { useDecks } from "@/providers/decks-provider";
import { useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState, useCallback } from "react";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "saving" | "saved";

export default function NotesPage() {
  const { state, dispatch } = useDecks();
  const { id } = useParams<{ id: string }>();
  const deck = state.decks.find((d) => d.id === id);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);

  const save = useCallback(
    async (content: string) => {
      setSaveState("saving");
      try {
        await fetch(`/api/decks/${id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: content }),
        });
        dispatch({ type: "UPDATE_DECK_NOTES", deckId: id, notes: content });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("idle");
      }
    },
    [id, dispatch],
  );

  const parseNotes = (raw: string | null | undefined) => {
    if (!raw) return "";
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your notes here — grammar rules, pronunciation patterns, examples…",
      }),
    ],
    content: parseNotes(deck?.notes),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] text-foreground",
      },
    },
    onUpdate({ editor }) {
      const json = JSON.stringify(editor.getJSON());
      pendingRef.current = json;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save(json);
        pendingRef.current = null;
      }, 1500);
    },
  });

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pendingRef.current) {
        save(pendingRef.current);
      }
    };
  }, [save]);

  // Reinitialize editor content when deck loads (editor mounts before SWR resolves)
  useEffect(() => {
    if (editor && deck?.notes && editor.isEmpty) {
      editor.commands.setContent(parseNotes(deck.notes));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, deck?.notes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{deck?.title ?? "Notes"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Deck notes</p>
        </div>
        <span
          className={cn(
            "text-xs transition-opacity duration-300",
            saveState === "saving" && "text-muted-foreground opacity-100",
            saveState === "saved" && "text-success opacity-100",
            saveState === "idle" && "opacity-0",
          )}
        >
          {saveState === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex items-center gap-0.5 px-8 py-2 border-b border-border bg-background shrink-0">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={14} />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={14} />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered list"
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            active={false}
            title="Divider"
          >
            <Minus size={14} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "flex items-center justify-center w-7 h-7 rounded-sm transition-colors",
        active
          ? "bg-background-2 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-background-2",
      )}
    >
      {children}
    </button>
  );
}
