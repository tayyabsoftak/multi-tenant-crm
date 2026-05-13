export function useOptimisticUpdate<T>(value: T): { value: T } {
  return { value };
}
