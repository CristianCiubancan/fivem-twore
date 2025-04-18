interface ScrollbarStyles {
  '&::-webkit-scrollbar': {
    width: string;
    height: string;
  };
  '&::-webkit-scrollbar-track': {
    background: string;
    borderRadius: string;
  };
  '&::-webkit-scrollbar-thumb': {
    background: string;
    borderRadius: string;
    border: string;
  };
  '&::-webkit-scrollbar-thumb:hover': {
    background: string;
  };
}

export function createScrollbarStyles(
  trackBg: string,
  thumbBg: string,
  thumbBorder: string,
  thumbHoverBg: string
): ScrollbarStyles {
  return {
    '&::-webkit-scrollbar': {
      width: '12px',  // Decreased from 18px for more subtle scrollbars
      height: '12px', // Decreased from 18px for more subtle scrollbars
    },
    '&::-webkit-scrollbar-track': {
      background: trackBg,
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: thumbBg,
      borderRadius: '8px',
      border: thumbBorder,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: thumbHoverBg,
    },
  };
}
