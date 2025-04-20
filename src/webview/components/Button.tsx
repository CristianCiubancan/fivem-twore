const Button = ({ children, type, text, fullWidth, onClick }: any) => {
  return (
    <button
      type={type}
      className={`${
        fullWidth ? "w-full" : ""
      } px-4 py-2 glass-brand-dark hover:bg-brand-700/80 transition duration-200 border border-white/20`}
      onClick={onClick}
    >
      {children || text}
    </button>
  );
};

export default Button;
