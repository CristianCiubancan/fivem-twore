// src/context/MenuContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Define menu types
export type MenuPosition = "left" | "right" | "central" | "toast";

export interface MenuState {
  left: {
    isOpen: boolean;
    content: ReactNode | null;
  };
  right: {
    isOpen: boolean;
    content: ReactNode | null;
  };
  central: {
    isOpen: boolean;
    content: ReactNode | null;
  };
  toast: {
    isOpen: boolean;
    content: ReactNode | null;
    duration?: number;
  };
}

type MenuAction =
  | { type: "OPEN_MENU"; position: MenuPosition; content: ReactNode }
  | { type: "CLOSE_MENU"; position: MenuPosition }
  | { type: "SHOW_TOAST"; content: ReactNode; duration?: number }
  | { type: "HIDE_TOAST" };

// Initial state
const initialState: MenuState = {
  left: { isOpen: false, content: null },
  right: { isOpen: false, content: null },
  central: { isOpen: false, content: null },
  toast: { isOpen: false, content: null },
};

// Reducer function
const menuReducer = (state: MenuState, action: MenuAction): MenuState => {
  switch (action.type) {
    case "OPEN_MENU":
      return {
        ...state,
        [action.position]: {
          isOpen: true,
          content: action.content,
        },
      };
    case "CLOSE_MENU":
      return {
        ...state,
        [action.position]: {
          ...state[action.position],
          isOpen: false,
          content: null,
        },
      };
    case "SHOW_TOAST":
      return {
        ...state,
        toast: {
          isOpen: true,
          content: action.content,
          duration: action.duration || 3000,
        },
      };
    case "HIDE_TOAST":
      return {
        ...state,
        toast: {
          ...state.toast,
          isOpen: false,
          content: null,
        },
      };
    default:
      return state;
  }
};

// Create the context
interface MenuContextType {
  state: MenuState;
  showMenu: (position: MenuPosition, content: ReactNode) => void;
  closeMenu: (position: MenuPosition) => void;
  showToast: (content: ReactNode, duration?: number) => void;
  hideToast: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Provider component
export const MenuProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(menuReducer, initialState);

  const showMenu = (position: MenuPosition, content: ReactNode) => {
    dispatch({ type: "OPEN_MENU", position, content });
  };

  const closeMenu = (position: MenuPosition) => {
    dispatch({ type: "CLOSE_MENU", position });
  };

  const showToast = (content: ReactNode, duration?: number) => {
    dispatch({ type: "SHOW_TOAST", content, duration });

    if (duration !== undefined) {
      setTimeout(() => {
        hideToast();
      }, duration);
    }
  };

  const hideToast = () => {
    dispatch({ type: "HIDE_TOAST" });
  };

  return (
    <MenuContext.Provider
      value={{ state, showMenu, closeMenu, showToast, hideToast }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// Custom hook for using the menu context
export const useMenuSystem = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenuSystem must be used within a MenuProvider");
  }
  return context;
};
