import React from "react";

export default function ConfirmDialog({ open, title = "Confirm", message = "", onConfirm, onClose, confirmText = "Yes", cancelText = "Cancel" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-gray-600 mt-2">{message}</div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 text-sm">{cancelText}</button>
          <button onClick={() => { onConfirm && onConfirm(); }} className="px-3 py-1 rounded bg-red-600 text-white text-sm">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
