import  { useEffect, useState, useRef } from 'react'
import {
  searchPeople,
type  PersonSearchResponseDTO,
} from '../../blotter-api/Resident'
import { Search, Loader2 } from 'lucide-react'
interface PersonSearchInputProps {
  label?: string
  placeholder?: string
  onSelect: (person: PersonSearchResponseDTO) => void
}
export const PersonSearchInput = ({
  label = 'Search Person',
  placeholder = 'Type name to search...',
  onSelect,
}: PersonSearchInputProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true)
        try {
          const res = await searchPeople(query)
          setResults(res)
          setIsOpen(true)
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  return (
    <div className="relative w-full mb-4" ref={wrapperRef}>
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {loading ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            className="w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length < 2) setIsOpen(false)
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true)
            }}
          />
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-100 max-h-60 overflow-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((person) => (
                <li
                  key={person.id}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                  onClick={() => {
                    onSelect(person)
                    setIsOpen(false)
                    setQuery('')
                  }}
                >
                  <div className="font-medium text-sm text-gray-800">
                    {person.firstName}{' '}
                    {person.middleName ? person.middleName + ' ' : ''}
                    {person.lastName}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {person.completeAddress} • {person.contactNumber}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
