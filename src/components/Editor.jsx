import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/Editor.css';

const TOOLBAR_SELECTOR = '#quill-toolbar';

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

function Editor({ initialDelta, onContentChange }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const applyingExternalDeltaRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return;
    }

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_SELECTOR,
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: true
        }
      },
      placeholder: 'Start writing your document...'
    });

    quillRef.current = quill;

    const onTextChange = () => {
      if (applyingExternalDeltaRef.current) {
        return;
      }
      const delta = quill.getContents();
      const text = quill.getText().replace(/\n$/, '');
      onContentChange({
        delta,
        text,
        words: countWords(text)
      });
    };

    quill.on('text-change', onTextChange);

    const handleUndo = () => quill.history.undo();
    const handleRedo = () => quill.history.redo();

    window.addEventListener('manjaword:undo', handleUndo);
    window.addEventListener('manjaword:redo', handleRedo);

    return () => {
      window.removeEventListener('manjaword:undo', handleUndo);
      window.removeEventListener('manjaword:redo', handleRedo);
      quill.off('text-change', onTextChange);
      quillRef.current = null;
    };
  }, [onContentChange]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !initialDelta) {
      return;
    }

    applyingExternalDeltaRef.current = true;
    quill.setContents(initialDelta, 'silent');
    applyingExternalDeltaRef.current = false;
  }, [initialDelta]);

  return (
    <div className="editor-wrapper">
      <div ref={editorRef} className="editor-surface" />
    </div>
  );
}

export default Editor;
