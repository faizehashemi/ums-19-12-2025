import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children, position = 'right' }) => {
  const positions = {
    right: 'ml-auto',
    left: 'mr-auto',
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex">
        <Dialog.Panel className={`${positions[position]} h-full w-full max-w-md bg-white shadow-xl flex flex-col`}>
          {title && (
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const DrawerContent = ({ children, className = '' }) => (
  <div className={`px-4 py-4 ${className}`}>
    {children}
  </div>
);

const DrawerFooter = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 px-4 py-4 border-t bg-gray-50 ${className}`}>
    {children}
  </div>
);

Drawer.Content = DrawerContent;
Drawer.Footer = DrawerFooter;

export default Drawer;
