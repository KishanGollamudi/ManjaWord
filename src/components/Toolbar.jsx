import '../styles/Toolbar.css';

function Toolbar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExportDocx,
  onExportPdf,
  onExportTxt,
  onToggleGrammar,
  onToggleDarkMode,
  grammarEnabled,
  darkMode
}) {
  return (
    <div className="toolbar-shell">
      <div className="toolbar-actions">
        <button onClick={onNew}>New</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onSaveAs}>Save As</button>
        <button onClick={onExportDocx}>Export DOCX</button>
        <button onClick={onExportPdf}>Export PDF</button>
        <button onClick={onExportTxt}>Export TXT</button>
        <button onClick={onToggleGrammar}>{grammarEnabled ? 'Grammar On' : 'Grammar Off'}</button>
        <button onClick={onToggleDarkMode}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
      </div>

      <div id="quill-toolbar" className="toolbar-formatting">
        <span className="ql-formats">
          <button className="ql-bold" aria-label="Bold" />
          <button className="ql-italic" aria-label="Italic" />
          <button className="ql-underline" aria-label="Underline" />
        </span>
        <span className="ql-formats">
          <select className="ql-header" defaultValue="">
            <option value="">Paragraph</option>
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="4">H4</option>
            <option value="5">H5</option>
            <option value="6">H6</option>
          </select>
          <select className="ql-size" defaultValue="">
            <option value="small">Small</option>
            <option value="">Normal</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
          </select>
          <select className="ql-font" defaultValue="">
            <option value="">Default</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </span>
        <span className="ql-formats">
          <select className="ql-align" defaultValue="" />
          <button className="ql-list" value="ordered" aria-label="Numbered list" />
          <button className="ql-list" value="bullet" aria-label="Bullet list" />
        </span>
        <span className="ql-formats">
          <button className="ql-undo" onClick={() => window.dispatchEvent(new CustomEvent('manjaword:undo'))}>
            Undo
          </button>
          <button className="ql-redo" onClick={() => window.dispatchEvent(new CustomEvent('manjaword:redo'))}>
            Redo
          </button>
        </span>
      </div>
    </div>
  );
}

export default Toolbar;
