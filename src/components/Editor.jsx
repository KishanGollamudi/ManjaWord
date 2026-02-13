import { useEffect, useMemo, useRef } from 'react';
import Quill from 'quill';

const TOOLBAR = [
  ['bold', 'italic', 'underline'],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['undo', 'redo']
];


export default function Editor({ onReady, onChange, theme }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);

  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
      history: {
        delay: 750,
        maxStack: 100,
        userOnly: true
      },
      keyboard: {
        bindings: {
          undo: {
            key: 'z',
            shortKey: true,
            handler() {
              this.quill.history.undo();
            }
          },
          redo: {
            key: 'z',
            shortKey: true,
            shiftKey: true,
            handler() {
              this.quill.history.redo();
            }
          }
        }
      }
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules,
      placeholder: 'Start writing your document...'
    });

    quill.on('text-change', () => {
      onChange(quill.getContents(), quill.getText());
    });

    quillRef.current = quill;
    onReady(quill);
  }, [modules, onReady, onChange]);

  useEffect(() => {
    if (!quillRef.current) return;
    document.body.dataset.theme = theme;
  }, [theme]);

  return <div ref={containerRef} className="editor-shell" />;
}
