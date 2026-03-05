// ═══════════════════════════════════════════════
// src/components/Modal.js — Bottom-sheet modal wrapper
// ═══════════════════════════════════════════════

function Modal({ title, onClose, children }) {
  return React.createElement(
    "div",
    {
      className: "modal-overlay",
      onClick: e => { if (e.target === e.currentTarget) onClose(); },
    },
    React.createElement(
      "div",
      { className: "modal-sheet" },
      React.createElement("div", { className: "modal-handle" }),
      title && React.createElement("div", { className: "modal-title" }, title),
      children
    )
  );
}