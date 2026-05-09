import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-pastel-accent/30 rounded-full">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title || '¿Confirmar eliminación?'}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {message || 'Esta acción no se puede deshacer.'}
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={onClose} className="btn-ghost border border-gray-200">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger disabled:opacity-60"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
