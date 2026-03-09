import '../styles/StatusBar.css';

function StatusBar({ filePath, saveState, wordCount, grammarMatches, errorMessage }) {
  return (
    <footer className="status-bar">
      <span>File: {filePath || 'Untitled'}</span>
      <span>Words: {wordCount}</span>
      <span>Grammar matches: {grammarMatches}</span>
      <span>State: {saveState}</span>
      <span className="status-error">{errorMessage}</span>
    </footer>
  );
}

export default StatusBar;
