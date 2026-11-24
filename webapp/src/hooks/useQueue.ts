import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  salonsApi,
  queuesApi,
  usersApi,
  authApi,
  getStoredUser,
  getStoredAccessToken,
  type ListSalonsParams,
  type ListQueueEntriesParams,
  type ListUsersParams,
  type SalonOut,
  type SalonDetailOut,
  type ServiceOut,
  type QueueTokenOut,
  type QueueStateOut,
  type UserOut,
  type AuthUser,
  type SalonCreatePayload,
  type SalonUpdatePayload,
  type ServiceCreatePayload,
  type ServiceUpdatePayload,
  type JoinQueuePayload,
  type WalkInPayload,
  type LoginPayload,
  type RegisterPayload,
  type PaginatedResponse,
} from '@/api';

function getErrMsg(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export const queryKeys = {
  salons: (params?: ListSalonsParams) => ['salons', params] as const,
  salon: (id: string) => ['salon', id] as const,
  salonServices: (salonId: string) => ['salonServices', salonId] as const,
  salonQueue: (salonId: string) => ['salonQueue', salonId] as const,
  salonQueueEntries: (salonId: string, params?: ListQueueEntriesParams) =>
    ['salonQueueEntries', salonId, params] as const,
  token: (id: string) => ['token', id] as const,
  myQueue: () => ['myQueue'] as const,
  users: (params?: ListUsersParams) => ['users', params] as const,
  user: (id: string) => ['user', id] as const,
  currentUser: () => ['currentUser'] as const,
};

// ==========================================
// Auth Hooks
// ==========================================

export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.currentUser(),
    queryFn: async () => {
      const token = getStoredAccessToken();
      if (!token) return null;
      try {
        return await authApi.getMe();
      } catch {
        return getStoredUser();
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.currentUser(), data.user);
      qc.invalidateQueries();
      toast.success(`Welcome back, ${data.user.full_name}!`);
    },
    onError: (err: unknown) => {
      toast.error(getErrMsg(err, 'Login failed. Please check your credentials.'));
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: queryKeys.users() });
      toast.success(`Account created for ${user.full_name}! Please sign in.`);
    },
    onError: (err: unknown) => {
      toast.error(getErrMsg(err, 'Registration failed.'));
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear();
      toast.info('Signed out successfully.');
    },
  });
}

// ==========================================
// Salons Hooks
// ==========================================

export function useSalons(params?: ListSalonsParams) {
  return useQuery<PaginatedResponse<SalonOut>>({
    queryKey: queryKeys.salons(params),
    queryFn: () => salonsApi.listSalons(params),
    staleTime: 5000,
  });
}

export function useSalon(id: string) {
  return useQuery<SalonDetailOut | null>({
    queryKey: queryKeys.salon(id),
    queryFn: () => (id ? salonsApi.getSalon(id) : null),
    enabled: Boolean(id),
    staleTime: 5000,
  });
}

export function useSalonServices(salonId: string) {
  return useQuery<ServiceOut[]>({
    queryKey: queryKeys.salonServices(salonId),
    queryFn: () => (salonId ? salonsApi.listServices(salonId) : []),
    enabled: Boolean(salonId),
    staleTime: 5000,
  });
}

export function useCreateSalon() {
  const qc = useQueryClient();
  return useMutation<SalonOut, Error, SalonCreatePayload>({
    mutationFn: (payload) => salonsApi.createSalon(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salons'] });
      toast.success('Salon created successfully');
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Failed to create salon')),
  });
}

export function useUpdateSalon() {
  const qc = useQueryClient();
  return useMutation<SalonOut, Error, { id: string; data: SalonUpdatePayload }>({
    mutationFn: ({ id, data }) => salonsApi.updateSalon(id, data),
    onSuccess: (salon) => {
      qc.invalidateQueries({ queryKey: ['salons'] });
      qc.invalidateQueries({ queryKey: queryKeys.salon(salon.id) });
      toast.success('Salon settings updated');
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Failed to update salon')),
  });
}

// ==========================================
// Services Hooks
// ==========================================

export function useAddService() {
  const qc = useQueryClient();
  return useMutation<ServiceOut, Error, { salonId: string; service: ServiceCreatePayload }>({
    mutationFn: ({ salonId, service }) => salonsApi.createService(salonId, service),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonServices(vars.salonId) });
      qc.invalidateQueries({ queryKey: queryKeys.salon(vars.salonId) });
      toast.success('Service added successfully');
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Failed to add service')),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation<ServiceOut, Error, { salonId: string; serviceId: string; service: ServiceUpdatePayload }>({
    mutationFn: ({ salonId, serviceId, service }) =>
      salonsApi.updateService(salonId, serviceId, service),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonServices(vars.salonId) });
      qc.invalidateQueries({ queryKey: queryKeys.salon(vars.salonId) });
      toast.success('Service updated');
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Failed to update service')),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation<void, Error, { salonId: string; serviceId: string }>({
    mutationFn: ({ salonId, serviceId }) => salonsApi.deleteService(salonId, serviceId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonServices(vars.salonId) });
      qc.invalidateQueries({ queryKey: queryKeys.salon(vars.salonId) });
      toast.success('Service removed');
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Failed to delete service')),
  });
}

// ==========================================
// Queue Management Hooks
// ==========================================

export function useSalonQueue(salonId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<QueueStateOut>({
    queryKey: queryKeys.salonQueue(salonId),
    queryFn: () => (salonId ? queuesApi.getSalonQueue(salonId) : Promise.reject('No salonId')),
    enabled: Boolean(salonId),
    refetchInterval: options?.refetchInterval ?? 3000,
    staleTime: 2000,
  });
}

export function useStaffQueueDashboard(salonId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<QueueStateOut>({
    queryKey: queryKeys.salonQueue(salonId),
    queryFn: () => (salonId ? queuesApi.getStaffDashboard(salonId) : Promise.reject('No salonId')),
    enabled: Boolean(salonId),
    refetchInterval: options?.refetchInterval ?? 3000,
    staleTime: 2000,
  });
}

export function useSalonQueueEntries(salonId: string, params?: ListQueueEntriesParams) {
  return useQuery<PaginatedResponse<QueueTokenOut>>({
    queryKey: queryKeys.salonQueueEntries(salonId, params),
    queryFn: () =>
      salonId
        ? queuesApi.listQueueEntries(salonId, params)
        : Promise.resolve({ items: [], total: 0, page: 1, limit: 10, total_pages: 1 }),
    enabled: Boolean(salonId),
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useToken(entryId: string, options?: { refetchInterval?: number | false }) {
  return useQuery<QueueTokenOut | null>({
    queryKey: queryKeys.token(entryId),
    queryFn: () => (entryId ? queuesApi.getTokenDetails(entryId) : null),
    enabled: Boolean(entryId),
    refetchInterval: options?.refetchInterval ?? 3000,
    staleTime: 2000,
  });
}

export function useMyQueue() {
  return useQuery<QueueTokenOut[]>({
    queryKey: queryKeys.myQueue(),
    queryFn: () => queuesApi.getMyQueue(),
    staleTime: 3000,
    refetchInterval: 5000,
  });
}

export function useJoinQueue() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string; data: JoinQueuePayload }>({
    mutationFn: ({ salonId, data }) => queuesApi.joinQueue(salonId, data),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      qc.invalidateQueries({ queryKey: queryKeys.myQueue() });
      toast.success(`You're in the queue! Token #${token.token_number}`);
    },
    onError: (err: unknown) =>
      toast.error(getErrMsg(err, 'Could not join the queue. Please try again.')),
  });
}

export function useCallNext() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string }>({
    mutationFn: ({ salonId }) => queuesApi.callNext(salonId),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      if (token) {
        toast.success(`Now serving #${token.token_number} — ${token.customer_name}`);
      } else {
        toast.info('No waiting customers in queue');
      }
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not call next customer.')),
  });
}

export function useStartService() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string; entryId: string }>({
    mutationFn: ({ salonId, entryId }) => queuesApi.startService(salonId, entryId),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      qc.invalidateQueries({ queryKey: queryKeys.token(vars.entryId) });
      toast.success(`Started service for #${token.token_number} — ${token.customer_name}`);
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not start service.')),
  });
}

export function useCompleteToken() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string; entryId: string }>({
    mutationFn: ({ salonId, entryId }) => queuesApi.completeService(salonId, entryId),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      qc.invalidateQueries({ queryKey: queryKeys.token(vars.entryId) });
      toast.success(`Completed #${token.token_number} — ${token.customer_name}`);
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not complete token.')),
  });
}

export function useSkipToken() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string; entryId: string }>({
    mutationFn: ({ salonId, entryId }) => queuesApi.skipToken(salonId, entryId),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      qc.invalidateQueries({ queryKey: queryKeys.token(vars.entryId) });
      toast.warning(`Skipped #${token.token_number} — ${token.customer_name}`);
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not skip token.')),
  });
}

export function useCancelToken() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { entryId: string; salonId?: string }>({
    mutationFn: ({ entryId }) => queuesApi.cancelToken(entryId),
    onSuccess: (token, vars) => {
      if (vars.salonId || token.salon_id) {
        const sid = (vars.salonId || token.salon_id)!;
        qc.invalidateQueries({ queryKey: queryKeys.salonQueue(sid) });
        qc.invalidateQueries({ queryKey: ['salonQueueEntries', sid] });
      }
      qc.invalidateQueries({ queryKey: queryKeys.token(vars.entryId) });
      qc.invalidateQueries({ queryKey: queryKeys.myQueue() });
      toast.info(`Cancelled #${token.token_number}`);
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not cancel token.')),
  });
}

export function useAddWalkIn() {
  const qc = useQueryClient();
  return useMutation<QueueTokenOut, Error, { salonId: string; data: WalkInPayload }>({
    mutationFn: ({ salonId, data }) => queuesApi.addWalkIn(salonId, data),
    onSuccess: (token, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.salonQueue(vars.salonId) });
      qc.invalidateQueries({ queryKey: ['salonQueueEntries', vars.salonId] });
      toast.success(`Walk-in added: #${token.token_number} — ${token.customer_name}`);
    },
    onError: (err: unknown) => toast.error(getErrMsg(err, 'Could not add walk-in.')),
  });
}

// ==========================================
// Users / Customers Hooks
// ==========================================

export function useUsers(params?: ListUsersParams) {
  return useQuery<PaginatedResponse<UserOut>>({
    queryKey: queryKeys.users(params),
    queryFn: () => usersApi.listUsers(params),
    staleTime: 5000,
  });
}

export function useUser(userId: string) {
  return useQuery<UserOut>({
    queryKey: queryKeys.user(userId),
    queryFn: () => usersApi.getUser(userId),
    enabled: Boolean(userId),
    staleTime: 5000,
  });
}
