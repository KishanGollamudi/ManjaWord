import {
  FilePlus2,
  FolderOpen,
  Save,
  SaveAll,
  FileOutput,
  FileArchive,
  RotateCcw,
  RotateCw
} from "lucide-react";
import "../styles/Toolbar.css";

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" className="toolbar-action" onClick={onClick} title={label}>
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

function Toolbar({ onNew, onOpen, onSave, onSaveAs, onExportDocx, onExportPdf, onUndo, onRedo }) {
  return (
    <section className="toolbar-shell" aria-label="Document toolbar">
      <div className="toolbar-ribbon">
        <div className="toolbar-group">
          <div className="toolbar-group-actions">
            <ActionButton icon={FilePlus2} label="New" onClick={onNew} />
            <ActionButton icon={FolderOpen} label="Open" onClick={onOpen} />
            <ActionButton icon={Save} label="Save" onClick={onSave} />
            <ActionButton icon={SaveAll} label="Save As" onClick={onSaveAs} />
          </div>
          <span className="toolbar-group-label">File</span>
        </div>

        <div className="toolbar-group">
          <div className="toolbar-group-actions">
            <ActionButton icon={RotateCcw} label="Undo" onClick={onUndo} />
            <ActionButton icon={RotateCw} label="Redo" onClick={onRedo} />
            <button className="toolbar-action ql-clean" title="Clear formatting" aria-label="Clear formatting" />
          </div>
          <span className="toolbar-group-label">Clipboard</span>
        </div>

        <div className="toolbar-group toolbar-group-format">
          <div id="quill-toolbar" className="toolbar-group-actions toolbar-formatting">
            <span className="ql-formats">
              <select className="ql-font" defaultValue="" aria-label="Font family">
                <option value="">Sans</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
              </select>
              <select className="ql-size" defaultValue="" aria-label="Font size">
                <option value="small">Small</option>
                <option value="">Normal</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
              </select>
            </span>

            <span className="ql-formats">
              <button className="ql-bold" title="Bold" aria-label="Bold" />
              <button className="ql-italic" title="Italic" aria-label="Italic" />
              <button className="ql-underline" title="Underline" aria-label="Underline" />
            </span>

            <span className="ql-formats">
              <select className="ql-header" defaultValue="" aria-label="Heading level">
                <option value="">Paragraph</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>
            </span>

            <span className="ql-formats">
              <select className="ql-align" defaultValue="" aria-label="Text alignment" />
              <button className="ql-list" value="ordered" title="Numbered list" aria-label="Numbered list" />
              <button className="ql-list" value="bullet" title="Bullet list" aria-label="Bullet list" />
            </span>
          </div>
          <span className="toolbar-group-label">Home</span>
        </div>

        <div className="toolbar-group">
          <div className="toolbar-group-actions">
            <ActionButton icon={FileOutput} label="Export DOCX" onClick={onExportDocx} />
            <ActionButton icon={FileArchive} label="Export PDF" onClick={onExportPdf} />
          </div>
          <span className="toolbar-group-label">Export</span>
        </div>
      </div>
    </section>
  );
}

export default Toolbar;
