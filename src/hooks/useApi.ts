import { useAuth } from '@clerk/expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authFetch = async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    const url = `${API_BASE_URL}${path}`;
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    return response.json();
  };

  return authFetch;
}

export function useAccounts() {
  const authFetch = useAuthenticatedFetch();
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => authFetch('/api/accounts'),
  });
}

export function useCreateAccount() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newAccount: { name: string; balance?: string }) =>
      authFetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(newAccount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useCategories() {
  const authFetch = useAuthenticatedFetch();
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => authFetch('/api/categories'),
  });
}

export function useCreateCategory() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCategory: { name: string; monthlyBudget?: string }) =>
      authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useTransactions() {
  const authFetch = useAuthenticatedFetch();
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => authFetch('/api/transactions'),
  });
}

export function useCreateTransaction() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tx: {
      accountId: string;
      categoryId?: string | null;
      amount: number;
      description: string;
      timestamp?: string;
      needsReview?: boolean;
    }) =>
      authFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(tx),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useReviewTransaction() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categoryId, needsReview }: { id: string; categoryId?: string | null; needsReview?: boolean }) =>
      authFetch(`/api/transactions/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ categoryId, needsReview }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...tx }: { id: string; description?: string; amount?: number; accountId?: string; categoryId?: string | null; timestamp?: string; needsReview?: boolean }) =>
      authFetch(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tx),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const authFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
