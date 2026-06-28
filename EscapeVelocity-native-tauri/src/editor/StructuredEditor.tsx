/** The visual block editor (M3). A TipTap editor over our semantic schema; on
 *  every change it serializes back to `document.json` (the source of truth) and
 *  the store regenerates + recompiles. The author never sees LaTeX here. */
import { useEffect } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { extensions } from "./schema";
import { bodyToEditorDoc, editorDocToBody, withBody } from "./serialize";
import { compileStore, useCompile } from "../compile/store";
import { SlashMenu } from "./SlashMenu";

export function StructuredEditor() {
  // Read once for the initial content; after mount the editor owns its content
  // and pushes changes outward (no store→editor feedback loop).
  const initialDoc = useCompile((s) => s.document);
  const docVersion = useCompile((s) => s.docVersion);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "ev-editor__content", spellcheck: "true" },
    },
    content: initialDoc
      ? (bodyToEditorDoc(initialDoc.body) as unknown as JSONContent)
      : undefined,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as unknown as Parameters<typeof editorDocToBody>[0];
      const body = editorDocToBody(json);
      const base = compileStore.getState().document;
      if (base) compileStore.setDocument(withBody(base, body));
    },
  });

  // Reload the editor content when the document is replaced externally (import).
  // emitUpdate:false so this doesn't echo back through onUpdate.
  useEffect(() => {
    const doc = compileStore.getState().document;
    if (editor && doc) {
      editor.commands.setContent(bodyToEditorDoc(doc.body) as unknown as JSONContent, {
        emitUpdate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docVersion]);

  // Dev-only inspection hook for automation (stripped in builds).
  useEffect(() => {
    if (editor && import.meta.env.DEV && typeof window !== "undefined") {
      (window as unknown as { __evEditor?: typeof editor }).__evEditor = editor;
    }
  }, [editor]);

  return (
    <div className="ev-editor">
      <EditorContent editor={editor} />
      <SlashMenu editor={editor} />
    </div>
  );
}
