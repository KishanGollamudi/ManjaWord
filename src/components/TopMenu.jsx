import '../styles/TopMenu.css';

function MenuSection({ title, actions }) {
  return (
    <div className="menu-section">
      <button className="menu-title">{title}</button>
      <div className="menu-dropdown">
        {actions.map((action) => (
          <button key={action.label} onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TopMenu({ actions }) {
  return (
    <header className="top-menu">
      <MenuSection
        title="File"
        actions={[
          { label: 'New', onClick: actions.newDocument },
          { label: 'Open', onClick: actions.openDocument },
          { label: 'Save', onClick: actions.saveDocument },
          { label: 'Save As', onClick: actions.saveAsDocument },
          { label: 'Export DOCX', onClick: actions.exportDocx },
          { label: 'Export PDF', onClick: actions.exportPdf },
          { label: 'Export TXT', onClick: actions.exportTxt }
        ]}
      />
      <MenuSection
        title="Edit"
        actions={[
          { label: 'Undo', onClick: actions.undo },
          { label: 'Redo', onClick: actions.redo }
        ]}
      />
      <MenuSection
        title="View"
        actions={[{ label: 'Toggle Theme', onClick: actions.toggleDarkMode }]}
      />
      <MenuSection
        title="Help"
        actions={[
          {
            label: 'About ManjaWord',
            onClick: () => window.alert('ManjaWord v1.0\nBuilt with Tauri + React for Linux.')
          }
        ]}
      />
    </header>
  );
}

export default TopMenu;
