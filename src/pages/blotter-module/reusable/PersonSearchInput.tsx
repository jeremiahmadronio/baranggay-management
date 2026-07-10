import { useEffect, useState, useRef } from "react";
import {
  searchPeople,
  type PersonSearchResponseDTO,
} from "../../../service/blotter-api/Resident";
import { Search } from "lucide-react";
interface PersonSearchInputProps {
  label?: string;
  placeholder?: string;
  onSelect: (person: PersonSearchResponseDTO) => void;
}
export const PersonSearchInput = ({
  label = "Search Person",
  placeholder = "Type name to search...",
  onSelect,
}: PersonSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await searchPeople(query);
          setResults(res);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <div className="relative w-full mb-4" ref={wrapperRef}>
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-semibold text-slate-700 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            maxLength={50}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pl-10 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              const raw = e.target.value;
              const sanitized = raw.replace(/[0-9]/g, "").replace(/[^a-zA-Z\s.,ñÑ-]/g, "");
              
              setQuery(raw); // Update state to raw to force React to update DOM
              
              if (raw !== sanitized) {
                setTimeout(() => {
                  setQuery(sanitized); // Revert to sanitized in next tick
                }, 0);
              }
              
              if (sanitized.length < 2) setIsOpen(false);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
          />
        </div>
      </div>
      
      {loading && <p className="text-xs text-slate-400 mt-1">Searching...</p>}
      
      {!loading && isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((person) => (
            <button
              key={person.id}
              type="button"
              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
              onClick={() => {
                onSelect(person);
                setIsOpen(false);
                setQuery("");
              }}
            >
              <div className="text-sm font-medium text-slate-900">
                {person.firstName} {person.middleName ? `${person.middleName} ` : ""}{person.lastName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {person.completeAddress}{person.contactNumber ? ` • ${person.contactNumber}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {!loading && isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200">
          <div className="px-4 py-3 text-sm text-slate-500 text-center">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};
