import { useState, useEffect, useRef } from "react";

// Define the shape of an option
interface Option {
  label: string;
  value: string;
}

// Define the props for FormSelect
interface FormSelectProps {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FormSelect = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
}: FormSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any | null>(null);

  // Derive the selected option from the value prop
  const selectedOption =
    options.find((option) => option.value === value) || null;

  // Toggle the dropdown and set the highlighted index based on the current value
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // When opening, highlight the selected option or the first option
      if (value) {
        const index = options.findIndex((option) => option.value === value);
        setHighlightedIndex(index !== -1 ? index : 0);
      } else {
        setHighlightedIndex(0);
      }
    } else {
      setHighlightedIndex(null);
    }
  };

  // Handle option selection by calling onChange and closing the dropdown
  const handleOptionSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(null);
  };

  // Handle keyboard interactions
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
      ) {
        setIsOpen(true);
        event.preventDefault();
        return;
      }
      if (event.key.length === 1 && /^[a-z0-9]$/i.test(event.key)) {
        setIsOpen(true);
        const newSearchString = event.key.toLowerCase();
        setSearchString(newSearchString);
        const index = options.findIndex((option) =>
          option.label.toLowerCase().startsWith(newSearchString)
        );
        if (index !== -1) {
          setHighlightedIndex(index);
        }
        timeoutRef.current = setTimeout(() => setSearchString(""), 1000);
        event.preventDefault();
        return;
      }
    }

    if (isOpen) {
      if (event.key === "Escape") {
        setIsOpen(false);
        event.preventDefault();
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        if (highlightedIndex !== null) {
          handleOptionSelect(options[highlightedIndex]);
        }
        event.preventDefault();
        return;
      }

      if (event.key === "ArrowDown") {
        setHighlightedIndex((prev) =>
          prev === null ? 0 : Math.min(prev + 1, options.length - 1)
        );
        event.preventDefault();
        return;
      }

      if (event.key === "ArrowUp") {
        setHighlightedIndex((prev) =>
          prev === null ? 0 : Math.max(prev - 1, 0)
        );
        event.preventDefault();
        return;
      }

      if (event.key.length === 1 && /^[a-z0-9]$/i.test(event.key)) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const newSearchString = searchString + event.key.toLowerCase();
        setSearchString(newSearchString);
        const index = options.findIndex((option) =>
          option.label.toLowerCase().startsWith(newSearchString)
        );
        if (index !== -1) {
          setHighlightedIndex(index);
        }
        timeoutRef.current = setTimeout(() => setSearchString(""), 1000);
        event.preventDefault();
        return;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll the highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex !== null && optionsRef.current) {
      const optionElement = optionsRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          readOnly
          aria-haspopup="true"
          aria-expanded={isOpen}
          value={selectedOption ? selectedOption.label : placeholder}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-2 glass-brand-dark rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-700/50 focus:border-transparent transition ${
            !selectedOption ? "!text-gray-400" : ""
          }`}
        />
        <div
          ref={optionsRef}
          className={`absolute z-10 mt-1 w-full glass-brand-dark rounded-lg transition-all duration-200 ease-out transform ${
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          } max-h-60 overflow-y-auto`}
        >
          {options.map((option: Option, index: number) => {
            const isActive = value === option.value;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={index}
                onClick={
                  !isActive ? () => handleOptionSelect(option) : undefined
                }
                className={`px-4 py-2 transition-all ${
                  isHighlighted ? "bg-brand-700" : ""
                } ${
                  isActive
                    ? "glass cursor-default cursor-not-allowed"
                    : "cursor-pointer hover:glass-dark"
                } border border-transparent`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FormSelect;
