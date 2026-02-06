import React from 'react';

const Modal = ({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display">{title}</h3>
          <button className="btn-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
