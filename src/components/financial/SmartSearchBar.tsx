// 🔍 SMART SEARCH BAR COMPONENT
// Enhanced search interface with autocomplete and filters

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { financialSearchService, type SearchFilters } from '@/lib/financialSearchService';

interface SearchSuggestion {
  label: string;
  value: string;
  type: 'supplier' | 'bill' | 'invoice' | 'category';
  metadata?: Record<string, any>;
}

interface SmartSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  placeholder?: string;
  searchType?: 'bills' | 'suppliers' | 'invoices' | 'all';
  initialFilters?: SearchFilters;
  showQuickFilters?: boolean;
  className?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = "Pesquisar registros financeiros...",
  searchType = 'all',
  initialFilters = {},
  showQuickFilters = true,
  className = ""
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  // Recent searches (stored in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('financial-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('financial-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsLoading(true);
        try {
          const suggestions = await financialSearchService.getSearchSuggestions(
            searchTerm, 
            searchType === 'all' ? 'bills' : searchType
          );
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchType]);

  // Handle search execution
  const executeSearch = useCallback(() => {
    const searchFilters = {
      ...filters,
      search: searchTerm
    };
    
    onSearch(searchFilters);
    saveRecentSearch(searchTerm);
    setShowSuggestions(false);
  }, [searchTerm, filters, onSearch, saveRecentSearch]);

  // Handle clear search
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
  }, [onClear]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.value);
    setShowSuggestions(false);
    
    // Auto-execute search with suggestion
    const searchFilters = {
      ...filters,
      search: suggestion.value
    };
    onSearch(searchFilters);
    saveRecentSearch(suggestion.value);
  }, [filters, onSearch, saveRecentSearch]);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [executeSearch]);

  // Handle filter changes
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto-search if we have a search term
    if (searchTerm) {
      onSearch({ ...newFilters, search: searchTerm });
    }
  }, [filters, searchTerm, onSearch]);

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && v !== ''
  ).length;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.length >= 2 || recentSearches.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="pl-10 pr-20"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {/* Advanced Filters Toggle */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 relative"
                title="Filtros avançados"
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros Avançados</h4>
                
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => updateFilter('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor mínimo</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={filters.amount_min || ''}
                      onChange={(e) => updateFilter('amount_min', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor máximo</label>
                    <Input
                      type="number"
                      placeholder="999.999,99"
                      value={filters.amount_max || ''}
                      onChange={(e) => updateFilter('amount_max', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data inicial</label>
                    <Input
                      type="date"
                      value={filters.date_from || ''}
                      onChange={(e) => updateFilter('date_from', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data final</label>
                    <Input
                      type="date"
                      value={filters.date_to || ''}
                      onChange={(e) => updateFilter('date_to', e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setShowFilters(false);
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear Button */}
          {(searchTerm || activeFiltersCount > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant={filters.status === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('status', filters.status === 'overdue' ? '' : 'overdue')}
            className="h-7"
          >
            Vencidos
          </Button>
          <Button
            variant={filters.status === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('status', filters.status === 'pending' ? '' : 'pending')}
            className="h-7"
          >
            Pendentes
          </Button>
          <Button
            variant={filters.active === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('active', filters.active === true ? undefined : true)}
            className="h-7"
          >
            Ativos
          </Button>
        </div>
      )}

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Sugestões
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">{suggestion.label}</div>
                        {suggestion.metadata && (
                          <div className="text-xs text-gray-500">
                            {Object.entries(suggestion.metadata)
                              .filter(([_, value]) => value)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(' • ')}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && suggestions.length === 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Buscas Recentes
                  </div>
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(recent);
                        setShowSuggestions(false);
                        onSearch({ ...filters, search: recent });
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      {recent}
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {suggestions.length === 0 && recentSearches.length === 0 && searchTerm.length >= 2 && (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Nenhuma sugestão encontrada
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;