import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Editor from './components/Editor';

const initialDelta = { ops: [{ insert: '\n' }] };

export default function App() {
  const quillRef = useRef(null);
  const [delta, setDelta] = useState(initialDelta);
  const [wordCount, setWordCount] = useState(0);
  const [grammarEnabled, setGrammarEnabled] = useState(false);
  const [grammarResult, setGrammarResult] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isDirty, setIsDirty] = useState(false);

  const title = useMemo(() => `ManjaWord-Rust${isDirty ? ' • Unsaved' : ''}`, [isDirty]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDirty) return;
      invoke('autosave_document', { content: delta }).catch(console.error);
    }, 30_000);

    return () => clearInterval(timer);
  }, [delta, isDirty]);

  useEffect(() => {
    invoke('recover_unsaved_document')
      .then((payload) => {
        if (!payload) return;
        setDelta(payload.content || initialDelta);
        setIsDirty(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    quillRef.current.setContents(delta);
  }, [delta]);

  const handleChange = useCallback((nextDelta, plainText) => {
    setDelta(nextDelta);
    const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setIsDirty(true);
  }, []);

  const handleNew = useCallback(() => {
    setDelta(initialDelta);
    setWordCount(0);
    setGrammarResult([]);
    setIsDirty(false);
  }, []);

  const handleOpen = useCallback(async () => {
    const opened = await invoke('open_file');
    if (!opened) return;
    setDelta(opened.content || initialDelta);
    setIsDirty(false);
  }, []);

  const handleSave = useCallback(async () => {
    await invoke('save_file', { content: delta });
    setIsDirty(false);
  }, [delta]);

  const handleExportDocx = useCallback(async () => {
    await invoke('export_docx', { content: delta });
  }, [delta]);

  const handleExportPdf = useCallback(async () => {
    await invoke('export_pdf', { content: delta });
  }, [delta]);

  const handleGrammar = useCallback(async () => {
    const next = !grammarEnabled;
    setGrammarEnabled(next);
    if (!next || !quillRef.current) {
      setGrammarResult([]);
      return;
    }
    const text = quillRef.current.getText();
    const response = await invoke('grammar_check', { text });
    setGrammarResult(response?.matches || []);
  }, [grammarEnabled]);

  return (
    <div className={`app ${theme}`}>
      <nav className="top-nav"><span>File</span><span>Edit</span><span>View</span><span>Help</span></nav>
      <header className="menu-bar">
        <div className="menu-group">
          <button onClick={handleNew}>New</button>
          <button onClick={handleOpen}>Open</button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleExportDocx}>Export DOCX</button>
          <button onClick={handleExportPdf}>Export PDF</button>
        </div>
        <div className="menu-group">
          <button onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button onClick={handleGrammar}>{`Grammar: ${grammarEnabled ? 'ON' : 'OFF'}`}</button>
        </div>
      </header>

      <main className="editor-area">
        <Editor onReady={(q) => (quillRef.current = q)} onChange={handleChange} theme={theme} />
      </main>

      <footer className="status-bar">
        <span>Words: {wordCount}</span>
        <span>Grammar Matches: {grammarResult.length}</span>
      </footer>
    </div>
  );
}
