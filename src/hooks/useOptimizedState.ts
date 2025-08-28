import { useState, useCallback, useMemo, useRef } from 'react';

// Optimized state hook for async operations
export function useAsyncState<T>(initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const setAsyncData = useCallback(async (asyncAction: () => Promise<T>) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncAction();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(initialValue);
      setError(null);
      setLoading(false);
    }
  }, [initialValue]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  return useMemo(() => ({
    data,
    loading,
    error,
    setData,
    setAsyncData,
    reset,
    cleanup
  }), [data, loading, error, setAsyncData, reset, cleanup]);
}

// Optimized form state hook
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  return useMemo(() => ({
    state,
    errors,
    touched,
    hasErrors,
    updateField,
    setFieldError,
    setState,
    setErrors,
    reset
  }), [state, errors, touched, hasErrors, updateField, setFieldError, reset]);
}

// Optimized pagination hook
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => 
    Math.ceil(items.length / itemsPerPage), 
    [items.length, itemsPerPage]
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return useMemo(() => ({
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    reset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }), [currentPage, totalPages, paginatedItems, goToPage, nextPage, prevPage, reset]);
}

// Optimized toggle hook
export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return useMemo(() => ({
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  }), [value, toggle, setTrue, setFalse]);
}