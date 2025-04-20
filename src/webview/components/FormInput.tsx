import React from "react";

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormInput = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        type={type}
        id={id}
        className="w-full px-4 py-2 glass-brand-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/50 focus:border-transparent transition"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default FormInput;
