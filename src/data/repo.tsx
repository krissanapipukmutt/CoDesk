import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { SampleRepo } from './sampleRepo';
import { SupabaseRepo } from './supabaseRepo';
import { hasSupabaseEnv } from './supabaseClient';
import {
  Booking,
  CreateBookingInput,
  CreateBookingResult,
  CancelBookingResult,
  Department,
  Employee,
  Holiday,
  Office,
  Profile,
  Seat,
  SessionInfo,
  ReportBookingsPerDay,
  ReportPopularSeats,
  ReportUtilization,
  ReportStatusSummary,
  ReportPeakTimes
} from './types';

export type RepoApi = {
  isDemo: boolean;
  init: () => Promise<boolean>;
  onAuthStateChange: (cb: (session: SessionInfo | null) => void) => () => void;
  signIn: (email: string, password: string) => Promise<SessionInfo>;
  signOut: () => Promise<void>;
  getSession: () => Promise<SessionInfo | null>;
  getProfile: () => Promise<Profile | null>;
  listOffices: () => Promise<Office[]>;
  listDepartments: () => Promise<Department[]>;
  listSeats: () => Promise<Seat[]>;
  listEmployees: () => Promise<Employee[]>;
  listHolidays: () => Promise<Holiday[]>;
  listBookings: () => Promise<Booking[]>;
  createBooking: (input: CreateBookingInput) => Promise<CreateBookingResult>;
  cancelBooking: (id: string, reason?: string | null) => Promise<CancelBookingResult>;
  createDepartment: (input: Omit<Department, 'id'>) => Promise<Department>;
  updateDepartment: (id: string, input: Omit<Department, 'id'>) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;
  createEmployee: (input: Omit<Employee, 'id'>) => Promise<Employee>;
  updateEmployee: (id: string, input: Omit<Employee, 'id'>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  createHoliday: (input: Omit<Holiday, 'id'>) => Promise<Holiday>;
  updateHoliday: (id: string, input: Omit<Holiday, 'id'>) => Promise<Holiday>;
  deleteHoliday: (id: string) => Promise<void>;
  reportBookingsPerDay: () => Promise<ReportBookingsPerDay[]>;
  reportUtilization: () => Promise<ReportUtilization[]>;
  reportPopularSeats: () => Promise<ReportPopularSeats[]>;
  reportStatusSummary: () => Promise<ReportStatusSummary[]>;
  reportPeakTimes: () => Promise<ReportPeakTimes[]>;
  subscribeBookings: (cb: () => void) => () => void;
  getDemoUsers?: () => { email: string; role: string; name: string }[];
};

type RepoContextValue = {
  repo: RepoApi;
  isDemo: boolean;
  ready: boolean;
  session: SessionInfo | null;
  profile: Profile | null;
  setDemo: (flag: boolean) => void;
};

const RepoContext = createContext<RepoContextValue | null>(null);

export const RepoProvider = ({
  children,
  queryClient
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) => {
  const [repo, setRepo] = useState<RepoApi>(() => new SupabaseRepo() as unknown as RepoApi);
  const [isDemo, setIsDemo] = useState(!hasSupabaseEnv);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const switchToDemo = () => {
    const demo = new SampleRepo() as unknown as RepoApi;
    setRepo(demo);
    setIsDemo(true);
  };

  useEffect(() => {
    const init = async () => {
      if (!hasSupabaseEnv) {
        switchToDemo();
        setReady(true);
        return;
      }
      const sb = new SupabaseRepo() as unknown as RepoApi;
      const ok = await sb.init();
      if (!ok) {
        switchToDemo();
        setReady(true);
        return;
      }
      setRepo(sb);
      setIsDemo(false);
      setReady(true);
    };
    void init();
  }, []);

  useEffect(() => {
    if (!ready) return;
    let unsubscribe = () => void 0;
    const initAuth = async () => {
      const current = await repo.getSession();
      setSession(current);
      if (current) {
        const prof = await repo.getProfile();
        setProfile(prof);
      } else {
        setProfile(null);
      }
      unsubscribe = repo.onAuthStateChange(async (sess) => {
        setSession(sess);
        if (sess) {
          const prof = await repo.getProfile();
          setProfile(prof);
        } else {
          setProfile(null);
        }
      });
    };
    void initAuth();
    return () => unsubscribe();
  }, [repo, ready]);

  useEffect(() => {
    if (!ready) return;
    const unsub = repo.subscribeBookings(() => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    });
    return () => unsub();
  }, [repo, ready, queryClient]);

  useEffect(() => {
    if (!ready || isDemo) return;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type !== 'queryUpdated') return;
      const state = event.query.state;
      if (state.status !== 'error') return;
      const message =
        state.error instanceof Error
          ? state.error.message
          : typeof state.error === 'string'
            ? state.error
            : JSON.stringify(state.error ?? '');
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        switchToDemo();
      }
    });
    return () => unsubscribe();
  }, [queryClient, ready, isDemo]);

  const value = useMemo(
    () => ({
      repo,
      isDemo,
      ready,
      session,
      profile,
      setDemo: (flag: boolean) => {
        if (flag) switchToDemo();
      }
    }),
    [repo, isDemo, ready, session, profile]
  );

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
};

export const useRepo = () => {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('RepoProvider missing');
  return ctx;
};
