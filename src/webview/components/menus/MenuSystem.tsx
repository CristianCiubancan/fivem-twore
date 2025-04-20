// src/components/menu/MenuSystem.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMenuSystem } from "../../context/MenuContext";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position: "left" | "right";
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  children,
  position,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {/* <div
        className="fixed inset-0 z-10 transition-opacity"
        onClick={onClose}
      /> */}

      {/* Menu */}
      <div
        className={`p-8 fixed top-0 bottom-0 ${
          position === "left" ? "left-0" : "right-0"
        } w-2/5 z-20 transform transition-transform duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0"
            : position === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
      >
        <div className="glass-brand-dark h-full overflow-y-auto p-4">
          {/* <button className="absolute top-10 right-16" onClick={onClose}>
            ✕
          </button> */}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </>
  );
};

// Central Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-200 bg-opacity-50 z-30 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`p-8 fixed top-1/2 left-1/2 w-2/5 z-40 transform transition-transform duration-300 ease-in-out max-h-[90vh] ${
          isOpen ? "translate-x-[-50%] translate-y-[-50%]" : "-translate-x-full"
        }`}
      >
        {/* Inner container with full height and scroll */}
        <div className="glass-brand-dark overflow-y-auto p-4 h-full">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
};

// Toast Component
interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  isOpen,
  onClose,
  children,
  duration = 3000,
}) => {
  // Auto close after duration
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed top-4 right-4 left-4 z-50 flex justify-center pointer-events-none">
      <div className="bg-gray-800 px-6 py-3 rounded-lg shadow-lg pointer-events-auto max-w-md">
        <div className="flex items-center justify-between">
          <div>{children}</div>
          <button className="ml-4" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Main Menu System Component
export const MenuSystem: React.FC = () => {
  const { state, closeMenu, hideToast } = useMenuSystem();

  return (
    <>
      {/* Left Menu */}
      <SideMenu
        isOpen={state.left.isOpen}
        onClose={() => closeMenu("left")}
        position="left"
      >
        {state.left.content}
      </SideMenu>

      {/* Right Menu */}
      <SideMenu
        isOpen={state.right.isOpen}
        onClose={() => closeMenu("right")}
        position="right"
      >
        {state.right.content}
      </SideMenu>

      {/* Central Modal */}
      <Modal isOpen={state.central.isOpen} onClose={() => closeMenu("central")}>
        {state.central.content}
      </Modal>

      {/* Toast */}
      <Toast
        isOpen={state.toast.isOpen}
        onClose={hideToast}
        duration={state.toast.duration}
      >
        {state.toast.content}
      </Toast>
    </>
  );
};
