const FormTextarea = ({ id, label, rows = 4, placeholder = "" }: any) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="w-full px-4 py-2 glass-brand-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/50 focus:border-transparent transition"
        placeholder={placeholder}
      ></textarea>
    </div>
  );
};

export default FormTextarea;
