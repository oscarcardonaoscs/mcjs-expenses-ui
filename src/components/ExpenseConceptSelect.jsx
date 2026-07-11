// src/components/ExpenseConceptSelect.jsx
import { useEffect, useMemo, useRef, useState } from "react";

function normalize(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function ExpenseConceptSelect({
  concepts = [],
  value = "",
  onChange,
  onCreate,
  isLoading = false,
  disabled = false,
  error = "",
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedConcept = useMemo(
    () =>
      concepts.find((concept) => String(concept.id) === String(value || "")) ??
      null,
    [concepts, value],
  );

  const filteredConcepts = useMemo(() => {
    const term = normalize(searchText);

    if (!term) {
      return concepts;
    }

    return concepts.filter((concept) => normalize(concept.name).includes(term));
  }, [concepts, searchText]);

  useEffect(() => {
    if (selectedConcept) {
      setSearchText(selectedConcept.name);
      return;
    }

    if (!value && !isOpen) {
      setSearchText("");
    }
  }, [selectedConcept, value, isOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);

        if (selectedConcept) {
          setSearchText(selectedConcept.name);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [selectedConcept]);

  useEffect(() => {
    if (!isOpen || filteredConcepts.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((current) => {
      if (current < 0 || current >= filteredConcepts.length) {
        return 0;
      }

      return current;
    });
  }, [filteredConcepts, isOpen]);

  const selectConcept = (concept) => {
    setSearchText(concept.name);
    onChange?.(String(concept.id));
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;

    setSearchText(nextValue);
    setIsOpen(true);

    if (
      !selectedConcept ||
      normalize(nextValue) !== normalize(selectedConcept.name)
    ) {
      onChange?.("");
    }
  };

  const handleInputFocus = (event) => {
    setIsOpen(true);

    window.requestAnimationFrame(() => {
      event.target.select();
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      if (filteredConcepts.length === 0) {
        return;
      }

      setActiveIndex((current) =>
        current >= filteredConcepts.length - 1 ? 0 : current + 1,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      if (filteredConcepts.length === 0) {
        return;
      }

      setActiveIndex((current) =>
        current <= 0 ? filteredConcepts.length - 1 : current - 1,
      );

      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();

      const concept = filteredConcepts[activeIndex];

      if (concept) {
        selectConcept(concept);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);

      if (selectedConcept) {
        setSearchText(selectedConcept.name);
      } else {
        setSearchText("");
      }
    }
  };

  const handleToggle = () => {
    if (disabled || isLoading) {
      return;
    }

    setIsOpen((current) => !current);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleCreate = () => {
    onCreate?.(searchText.trim());
  };

  return (
    <div ref={rootRef} className="position-relative">
      <label className="form-label">Concept</label>

      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className={`form-control ${error ? "is-invalid" : ""}`}
          value={searchText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Loading..." : "Search concept..."}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="expense-concept-options"
          disabled={disabled || isLoading}
        />

        <button
          type="button"
          className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
          onClick={handleToggle}
          aria-label="Toggle concept options"
          disabled={disabled || isLoading}
        >
          <span className="visually-hidden">Toggle concept options</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleCreate}
          disabled={disabled || isLoading}
        >
          <i className="bi bi-plus-lg me-1" />
          New
        </button>
      </div>

      {error ? <div className="text-danger small mt-1">{error}</div> : null}

      {isOpen && !disabled && !isLoading ? (
        <div
          id="expense-concept-options"
          className="dropdown-menu show w-100 p-0 mt-1"
          role="listbox"
          style={{
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          {filteredConcepts.length > 0 ? (
            filteredConcepts.map((concept, index) => (
              <button
                key={concept.id}
                type="button"
                className={`dropdown-item ${
                  index === activeIndex ? "active" : ""
                }`}
                role="option"
                aria-selected={String(concept.id) === String(value || "")}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectConcept(concept);
                }}
              >
                {concept.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-muted">No concepts found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
