import React from "react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "",
  onConfirm,
  onClose,
  confirmText = "Yes",
  cancelText = "Cancel"
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-slate-900 text-gray-100 rounded-lg shadow-lg w-full max-w-md p-5">
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-gray-400 mt-2">{message}</div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-gray-300 transition"
          >
            {cancelText}
          </button>

          <button
            onClick={() => onConfirm && onConfirm()}
            className="px-4 py-1.5 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
