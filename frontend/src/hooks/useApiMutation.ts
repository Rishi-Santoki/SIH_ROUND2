import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey, MutationFunction } from '@tanstack/react-query';

export interface UseApiMutationOptions<TData = any, TVariables = any> {
  mutationFn?: MutationFunction<TData, TVariables>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: QueryKey[];
  successMessage?: string;
}

export function useApiMutation<TData = any, TVariables = any>(
  fnOrOptions: MutationFunction<TData, TVariables> | UseApiMutationOptions<TData, TVariables>,
  maybeOptions?: UseApiMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  let mutationFn: MutationFunction<TData, TVariables>;
  let options: UseApiMutationOptions<TData, TVariables>;

  if (typeof fnOrOptions === 'function') {
    mutationFn = fnOrOptions;
    options = maybeOptions || {};
  } else {
    mutationFn = fnOrOptions.mutationFn!;
    options = fnOrOptions;
  }

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error, variables) => {
      if (options.onError) {
        options.onError(error, variables);
      }
    },
  });
}
