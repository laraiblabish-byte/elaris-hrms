import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Close',
  variant = 'danger',
  loading = false,
  icon: Icon = AlertTriangle,
  iconBg = 'bg-rose-50',
  iconColor = 'text-rose-600',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={!loading}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center ${iconColor} mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-[#2D3250] mb-2">{title}</h4>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex items-center gap-3 w-full justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-1/2"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            className="w-1/2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

