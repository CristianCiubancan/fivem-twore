import { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface DatePickerProps {
  id: string;
  label: string;
  placeholder?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  selected?: Date | null;
  onChange?: (date: Date | null) => void;
}

const DatePicker = ({
  id,
  label,
  placeholder = "Select a date",
  minDate = null,
  maxDate = null,
  selected = null,
  onChange,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [displayMonth, setDisplayMonth] = useState<number | null>(null);
  const [displayYear, setDisplayYear] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<"days" | "years">("days");
  const [yearViewStartYear, setYearViewStartYear] = useState<number | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const normalizedMinDate = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : null;
  const normalizedMaxDate = maxDate
    ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
    : null;

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;

  const isSelectable = (date: Date): boolean => {
    if (normalizedMinDate && date < normalizedMinDate) return false;
    if (normalizedMaxDate && date > normalizedMaxDate) return false;
    return true;
  };

  const canGoToPrevMonth = () => {
    if (displayMonth === null || displayYear === null) return false;
    const prevMonth = displayMonth === 0 ? 11 : displayMonth - 1;
    const prevYear = displayMonth === 0 ? displayYear - 1 : displayYear;
    const firstDay = new Date(prevYear, prevMonth, 1);
    const lastDay = new Date(prevYear, prevMonth + 1, 0);
    return (
      (normalizedMinDate === null || lastDay >= normalizedMinDate) &&
      (normalizedMaxDate === null || firstDay <= normalizedMaxDate)
    );
  };

  const canGoToNextMonth = () => {
    if (displayMonth === null || displayYear === null) return false;
    const nextMonth = displayMonth === 11 ? 0 : displayMonth + 1;
    const nextYear = displayMonth === 11 ? displayYear + 1 : displayYear;
    const firstDay = new Date(nextYear, nextMonth, 1);
    const lastDay = new Date(nextYear, nextMonth + 1, 0);
    return (
      (normalizedMinDate === null || lastDay >= normalizedMinDate) &&
      (normalizedMaxDate === null || firstDay <= normalizedMaxDate)
    );
  };

  const togglePopup = (): void => {
    if (!isOpen) {
      let dateToDisplay;
      if (selected) {
        dateToDisplay = selected;
      } else {
        const currentDate = new Date();
        if (
          (!normalizedMinDate || normalizedMinDate <= currentDate) &&
          (!normalizedMaxDate || currentDate <= normalizedMaxDate)
        ) {
          dateToDisplay = currentDate;
        } else if (normalizedMaxDate && currentDate > normalizedMaxDate) {
          dateToDisplay = normalizedMaxDate;
        } else if (normalizedMinDate && currentDate < normalizedMinDate) {
          dateToDisplay = normalizedMinDate;
        } else {
          dateToDisplay = currentDate;
        }
      }
      setDisplayMonth(dateToDisplay.getMonth());
      setDisplayYear(dateToDisplay.getFullYear());
      setCurrentView("days");
    }
    setIsOpen(!isOpen);
  };

  const handlePrevMonth = (): void => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((prev) => (prev !== null ? prev - 1 : null));
    } else {
      setDisplayMonth((prev) => (prev !== null ? prev - 1 : null));
    }
  };

  const handleNextMonth = (): void => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((prev) => (prev !== null ? prev + 1 : null));
    } else {
      setDisplayMonth((prev) => (prev !== null ? prev + 1 : null));
    }
  };

  const handleDateSelect = (date: Date): void => {
    if (isSelectable(date)) {
      if (onChange) {
        onChange(date);
      }
      setIsOpen(false);
    }
  };

  const getGridDates = (month: number, year: number): Date[] => {
    const firstDay = new Date(year, month, 1).getDay();
    const startDate = new Date(year, month, 1 - firstDay);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) {
      grid.push(new Date(startDate.getTime() + i * 86400000));
    }
    return grid;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
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

  const gridDates =
    displayMonth !== null && displayYear !== null
      ? getGridDates(displayMonth, displayYear)
      : [];

  const handlePrev =
    currentView === "days"
      ? handlePrevMonth
      : () =>
          setYearViewStartYear(
            Math.max(minYear, (yearViewStartYear || minYear) - 12)
          );

  const handleNext =
    currentView === "days"
      ? handleNextMonth
      : () =>
          setYearViewStartYear(
            Math.min(maxYear - 11, (yearViewStartYear || minYear) + 12)
          );

  const canPrev =
    currentView === "days"
      ? canGoToPrevMonth()
      : yearViewStartYear !== null && minYear < yearViewStartYear;

  const canNext =
    currentView === "days"
      ? canGoToNextMonth()
      : yearViewStartYear !== null && maxYear > yearViewStartYear + 11;

  const headerTitle =
    currentView === "days" ? (
      <div className="flex items-center">
        <span>
          {new Date(displayYear!, displayMonth!).toLocaleDateString("en-US", {
            month: "long",
          })}
        </span>
        <button
          onClick={() => {
            setCurrentView("years");
            setYearViewStartYear(Math.max(minYear, displayYear! - 5));
          }}
          className="ml-2 underline hover:text-gray-300"
        >
          {displayYear}
        </button>
      </div>
    ) : (
      <span>{`${yearViewStartYear} - ${yearViewStartYear! + 11}`}</span>
    );

  const years =
    yearViewStartYear !== null
      ? Array.from({ length: 12 }, (_, i) => yearViewStartYear + i).filter(
          (year) => year >= minYear && year <= maxYear
        )
      : [];

  return (
    <div className="space-y-2" ref={containerRef}>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          aria-haspopup="true"
          aria-expanded={isOpen}
          readOnly
          value={
            selected
              ? selected.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : placeholder
          }
          onClick={togglePopup}
          className={`w-full px-4 py-2 glass-brand-dark rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-700/50 focus:border-transparent transition ${
            !selected ? "!text-gray-400" : ""
          }`}
        />
        <div
          className={`absolute z-10 mt-1 w-full glass-brand-dark rounded-lg transition-all duration-200 ease-out transform ${
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {isOpen && displayMonth !== null && displayYear !== null && (
            <div>
              <div className="flex justify-between items-center p-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className={`p-2 w-9 h-9 border border-transparent ${
                    canPrev
                      ? "hover:glass-dark"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  aria-label="Previous"
                >
                  <FaChevronLeft className="w-5 h-5" />
                </button>
                {headerTitle}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  className={`p-2 w-9 h-9 border border-transparent ${
                    canNext
                      ? "hover:glass-dark"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  aria-label="Next"
                >
                  <FaChevronRight className="w-5 h-5" />
                </button>
              </div>
              {currentView === "days" ? (
                <div className="grid grid-cols-7 gap-1 p-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center font-medium">
                      {day}
                    </div>
                  ))}
                  {gridDates.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === displayMonth;
                    const isSelected =
                      selected &&
                      date.toDateString() === selected.toDateString();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const isSelectableDate = isSelectable(date);
                    return (
                      <div
                        key={index}
                        onClick={
                          isSelectableDate && !isSelected
                            ? () => handleDateSelect(date)
                            : undefined
                        }
                        className={`p-2 text-center transition-all border ${
                          isToday && !isSelected
                            ? "glass"
                            : "border-transparent"
                        } ${
                          !isSelectableDate
                            ? "text-gray-300 cursor-not-allowed"
                            : isCurrentMonth
                            ? "text-gray-100"
                            : "text-gray-500"
                        } ${
                          isSelected
                            ? "glass-brand-dark text-white cursor-not-allowed"
                            : isSelectableDate
                            ? "hover:glass-dark cursor-pointer"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1 p-2">
                  {years.map((year) => (
                    <div
                      key={year}
                      onClick={() => {
                        setDisplayYear(year);
                        setCurrentView("days");
                      }}
                      className={`p-2 text-center transition-all ${
                        year === displayYear
                          ? "glass-brand-dark"
                          : "hover:glass-dark"
                      } cursor-pointer`}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
