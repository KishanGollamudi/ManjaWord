import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Toolbar from './components/Toolbar';
import TopMenu from './components/TopMenu';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import './styles/App.css';

const EMPTY_DELTA = { ops: [{ insert: '\n' }] };

function App() {
  const [docPath, setDocPath] = useState(null);
  const [docDelta, setDocDelta] = useState(EMPTY_DELTA);
  const [plainText, setPlainText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [grammarMatches, setGrammarMatches] = useState(0);
  const [grammarEnabled, setGrammarEnabled] = useState(true);
  const [saveState, setSaveState] = useState('Unsaved');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('manjaword-theme') === 'dark');
  const [errorMessage, setErrorMessage] = useState('');

  const dirtyRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('manjaword-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const setError = useCallback((message) => {
    setErrorMessage(message);
    window.setTimeout(() => setErrorMessage(''), 5000);
  }, []);

  useEffect(() => {
    let active = true;

    invoke('restore_autosave')
      .then((payload) => {
        if (!active || !payload) {
          return;
        }
        const shouldRestore = window.confirm(
          `Recovered an autosave from ${payload.timestamp}. Restore it?`
        );
        if (shouldRestore) {
          setDocDelta(payload.delta || EMPTY_DELTA);
          setPlainText(payload.plainText || '');
          setWordCount(payload.wordCount || 0);
          setSaveState('Recovered autosave');
          dirtyRef.current = true;
        }
      })
      .catch(() => {
        // Autosave restore is best effort.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!grammarEnabled) {
      setGrammarMatches(0);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const result = await invoke('check_grammar', { text: plainText });
        if (result.available) {
          setGrammarMatches(result.matches);
        } else {
          setGrammarMatches(0);
        }
      } catch {
        setGrammarMatches(0);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [plainText, grammarEnabled]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (!dirtyRef.current) {
        return;
      }
      try {
        const autosaveMeta = await invoke('autosave_document', {
          delta: docDelta,
          plainText,
          wordCount
        });
        setSaveState(`Autosaved ${autosaveMeta.timestamp}`);
      } catch {
        // Autosave failures should not block editing.
      }
    }, 30000);

    return () => window.clearInterval(timer);
  }, [docDelta, plainText, wordCount]);

  const updateContent = useCallback(({ delta, text, words }) => {
    setDocDelta(delta);
    setPlainText(text);
    setWordCount(words);
    setSaveState('Unsaved');
    dirtyRef.current = true;
  }, []);

  const newDocument = useCallback(async () => {
    try {
      const payload = await invoke('new_document');
      setDocPath(null);
      setDocDelta(payload.delta);
      setPlainText(payload.plainText);
      setWordCount(0);
      setSaveState('New document');
      dirtyRef.current = false;
    } catch (error) {
      setError(String(error));
    }
  }, [setError]);

  const openDocument = useCallback(async () => {
    try {
      const payload = await invoke('open_document');
      setDocPath(payload.path);
      setDocDelta(payload.delta || EMPTY_DELTA);
      setPlainText(payload.plainText || '');
      setWordCount(payload.wordCount || 0);
      setSaveState('Opened');
      dirtyRef.current = false;
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [setError]);

  const saveDocument = useCallback(async () => {
    try {
      if (!docPath) {
        const response = await invoke('save_as_document', {
          delta: docDelta,
          plainText,
          wordCount
        });
        setDocPath(response.path);
      } else {
        await invoke('save_document', {
          path: docPath,
          delta: docDelta,
          plainText,
          wordCount
        });
      }
      setSaveState('Saved');
      dirtyRef.current = false;
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [docPath, docDelta, plainText, wordCount, setError]);

  const saveAsDocument = useCallback(async () => {
    try {
      const response = await invoke('save_as_document', {
        delta: docDelta,
        plainText,
        wordCount
      });
      setDocPath(response.path);
      setSaveState('Saved');
      dirtyRef.current = false;
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [docDelta, plainText, wordCount, setError]);

  const exportDocx = useCallback(async () => {
    try {
      await invoke('export_docx', { plainText });
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [plainText, setError]);

  const exportPdf = useCallback(async () => {
    try {
      await invoke('export_pdf', { plainText });
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [plainText, setError]);

  const exportTxt = useCallback(async () => {
    try {
      await invoke('export_txt', { plainText });
    } catch (error) {
      if (!String(error).includes('cancelled')) {
        setError(String(error));
      }
    }
  }, [plainText, setError]);

  const toggleGrammar = useCallback(() => {
    setGrammarEnabled((value) => !value);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((value) => !value);
  }, []);

  const menuActions = useMemo(
    () => ({
      newDocument,
      openDocument,
      saveDocument,
      saveAsDocument,
      toggleDarkMode,
      exportDocx,
      exportPdf,
      exportTxt,
      undo: () => window.dispatchEvent(new CustomEvent('manjaword:undo')),
      redo: () => window.dispatchEvent(new CustomEvent('manjaword:redo'))
    }),
    [
      newDocument,
      openDocument,
      saveDocument,
      saveAsDocument,
      toggleDarkMode,
      exportDocx,
      exportPdf,
      exportTxt
    ]
  );

  return (
    <div className="app-shell">
      <TopMenu actions={menuActions} />
      <Toolbar
        onNew={newDocument}
        onOpen={openDocument}
        onSave={saveDocument}
        onSaveAs={saveAsDocument}
        onExportDocx={exportDocx}
        onExportPdf={exportPdf}
        onExportTxt={exportTxt}
        onToggleGrammar={toggleGrammar}
        onToggleDarkMode={toggleDarkMode}
        grammarEnabled={grammarEnabled}
        darkMode={darkMode}
      />
      <Editor initialDelta={docDelta} onContentChange={updateContent} />
      <StatusBar
        filePath={docPath}
        saveState={saveState}
        wordCount={wordCount}
        grammarMatches={grammarMatches}
        errorMessage={errorMessage}
      />
    </div>
  );
}

export default App;
