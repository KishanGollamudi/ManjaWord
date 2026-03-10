import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Editor from "./components/Editor";
import Toolbar from "./components/Toolbar";
import TopMenu from "./components/TopMenu";
import StatusBar from "./components/StatusBar";
import "./styles/App.css";
import "./styles/index.css";

function isDialogCancelled(error) {
  const message = String(error || "").toLowerCase();
  return message.includes("cancelled");
}

function App() {
  const editorRef = useRef(null);
  const latestSnapshotRef = useRef({
    delta: { ops: [{ insert: "\n" }] },
    plainText: "",
    wordCount: 0
  });

  const [filePath, setFilePath] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [saveState, setSaveState] = useState("Idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const updateSnapshot = useCallback((snapshot) => {
    latestSnapshotRef.current = snapshot;
    setWordCount(snapshot.wordCount);
  }, []);

  const getSnapshot = useCallback(() => {
    const liveSnapshot = editorRef.current?.getSnapshot();
    return liveSnapshot || latestSnapshotRef.current;
  }, []);

  const pushDocumentToEditor = useCallback(
    (doc) => {
      editorRef.current?.setDocument(doc.delta);
      updateSnapshot({
        delta: doc.delta,
        plainText: doc.plainText,
        wordCount: doc.wordCount
      });
    },
    [updateSnapshot]
  );

  const newDocument = useCallback(async () => {
    try {
      setErrorMessage("");
      const response = await invoke("new_document");
      setFilePath("");
      pushDocumentToEditor({
        delta: response.delta,
        plainText: response.plainText,
        wordCount: 0
      });
      setSaveState("New document");
    } catch (error) {
      setErrorMessage(String(error));
      setSaveState("Error");
    }
  }, [pushDocumentToEditor]);

  const openDocument = useCallback(async () => {
    try {
      setErrorMessage("");
      const response = await invoke("open_document");
      setFilePath(response.path);
      pushDocumentToEditor({
        delta: response.delta,
        plainText: response.plainText,
        wordCount: response.wordCount
      });
      setSaveState("Opened");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
        setSaveState("Error");
      }
    }
  }, [pushDocumentToEditor]);

  const saveDocument = useCallback(async () => {
    const snapshot = getSnapshot();

    try {
      setErrorMessage("");

      if (!filePath) {
        const created = await invoke("save_as_document", {
          delta: snapshot.delta,
          plainText: snapshot.plainText,
          wordCount: snapshot.wordCount
        });
        setFilePath(created.path);
        setSaveState("Saved");
        return;
      }

      await invoke("save_document", {
        path: filePath,
        delta: snapshot.delta,
        plainText: snapshot.plainText,
        wordCount: snapshot.wordCount
      });
      setSaveState("Saved");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
        setSaveState("Error");
      }
    }
  }, [filePath, getSnapshot]);

  const saveAsDocument = useCallback(async () => {
    const snapshot = getSnapshot();

    try {
      setErrorMessage("");
      const response = await invoke("save_as_document", {
        delta: snapshot.delta,
        plainText: snapshot.plainText,
        wordCount: snapshot.wordCount
      });
      setFilePath(response.path);
      setSaveState("Saved");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
        setSaveState("Error");
      }
    }
  }, [getSnapshot]);

  const exportDocx = useCallback(async () => {
    const snapshot = getSnapshot();
    try {
      setErrorMessage("");
      await invoke("export_docx", { plainText: snapshot.plainText });
      setSaveState("Exported DOCX");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
      }
    }
  }, [getSnapshot]);

  const exportPdf = useCallback(async () => {
    const snapshot = getSnapshot();
    try {
      setErrorMessage("");
      await invoke("export_pdf", { plainText: snapshot.plainText });
      setSaveState("Exported PDF");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
      }
    }
  }, [getSnapshot]);

  const exportTxt = useCallback(async () => {
    const snapshot = getSnapshot();
    try {
      setErrorMessage("");
      await invoke("export_txt", { plainText: snapshot.plainText });
      setSaveState("Exported TXT");
    } catch (error) {
      if (!isDialogCancelled(error)) {
        setErrorMessage(String(error));
      }
    }
  }, [getSnapshot]);

  const undo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    let disposed = false;

    const restoreDraft = async () => {
      try {
        const restored = await invoke("restore_autosave");
        if (!restored || disposed) return;

        pushDocumentToEditor({
          delta: restored.delta,
          plainText: restored.plainText,
          wordCount: restored.wordCount
        });

        setSaveState(`Recovered autosave (${restored.timestamp})`);
      } catch (error) {
        if (!disposed) {
          setErrorMessage(String(error));
        }
      }
    };

    restoreDraft();

    return () => {
      disposed = true;
    };
  }, [pushDocumentToEditor]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const snapshot = getSnapshot();
      if (!snapshot.plainText.trim()) return;

      try {
        await invoke("autosave_document", {
          delta: snapshot.delta,
          plainText: snapshot.plainText,
          wordCount: snapshot.wordCount
        });
        setSaveState((current) => (current === "Error" ? current : "Autosaved"));
      } catch (error) {
        setErrorMessage(String(error));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [getSnapshot]);

  const menuActions = useMemo(
    () => ({
      newDocument,
      openDocument,
      saveDocument,
      saveAsDocument,
      exportDocx,
      exportPdf,
      exportTxt,
      undo,
      redo,
      toggleDarkMode
    }),
    [
      newDocument,
      openDocument,
      saveDocument,
      saveAsDocument,
      exportDocx,
      exportPdf,
      exportTxt,
      undo,
      redo,
      toggleDarkMode
    ]
  );

  return (
    <div className="app-root">
      <TopMenu actions={menuActions} />

      <Toolbar
        onNew={newDocument}
        onOpen={openDocument}
        onSave={saveDocument}
        onSaveAs={saveAsDocument}
        onExportDocx={exportDocx}
        onExportPdf={exportPdf}
        onUndo={undo}
        onRedo={redo}
      />

      <main className="editor-area">
        <Editor ref={editorRef} onContentChange={updateSnapshot} />
      </main>

      <StatusBar
        filePath={filePath}
        saveState={saveState}
        wordCount={wordCount}
        grammarMatches={0}
        errorMessage={errorMessage}
      />
    </div>
  );
}

export default App;
