import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "../styles/Editor.css";

const TOOLBAR_SELECTOR = "#quill-toolbar";

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const Editor = forwardRef(function Editor({ onContentChange }, ref) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const pendingDeltaRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      undo() {
        quillRef.current?.history.undo();
      },
      redo() {
        quillRef.current?.history.redo();
      },
      setDocument(delta) {
        if (!quillRef.current) {
          pendingDeltaRef.current = delta;
          return;
        }

        const selection = quillRef.current.getSelection();
        quillRef.current.setContents(delta, "api");

        if (selection) {
          const maxIndex = Math.max(quillRef.current.getLength() - 1, 0);
          quillRef.current.setSelection(Math.min(selection.index, maxIndex), selection.length, "silent");
        } else {
          quillRef.current.setSelection(0, 0, "silent");
        }
      },
      getSnapshot() {
        if (!quillRef.current) {
          return {
            delta: { ops: [{ insert: "\n" }] },
            plainText: "",
            wordCount: 0
          };
        }

        const plainText = quillRef.current.getText().replace(/\n$/, "");
        return {
          delta: quillRef.current.getContents(),
          plainText,
          wordCount: countWords(plainText)
        };
      }
    }),
    []
  );

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_SELECTOR,
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: true
        }
      },
      placeholder: "Start writing your document..."
    });

    quillRef.current = quill;
    if (pendingDeltaRef.current) {
      quill.setContents(pendingDeltaRef.current, "api");
      pendingDeltaRef.current = null;
    }

    const publishSnapshot = () => {
      const plainText = quill.getText().replace(/\n$/, "");

      onContentChange?.({
        delta: quill.getContents(),
        plainText,
        wordCount: countWords(plainText)
      });
    };

    quill.on("text-change", publishSnapshot);
    publishSnapshot();

    return () => {
      quill.off("text-change", publishSnapshot);
      quillRef.current = null;
    };
  }, [onContentChange]);

  return (
    <div className="editor-wrapper">
      <article className="editor-page">
        <div ref={editorRef} className="editor-surface" />
      </article>
    </div>
  );
});

export default Editor;
