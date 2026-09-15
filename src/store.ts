import { useSyncExternalStore } from 'react'
import { seedState } from './seed'
import type {
  AppState,
  AttendanceRecord,
  Employer,
  JobStart,
  Program,
  Trainee,
} from './types'

const STORAGE_KEY = 'iskur-isbasi-state-v2'
const AUTH_KEY = 'iskur-isbasi-auth'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(seedState)
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.employer || !Array.isArray(parsed.programs)) {
      return structuredClone(seedState)
    }
    return {
      ...structuredClone(seedState),
      ...parsed,
      workplaces: parsed.workplaces?.length ? parsed.workplaces : structuredClone(seedState.workplaces),
      programs: parsed.programs.map((item) => ({
        ...structuredClone(seedState.programs[0]),
        ...item,
        belgeler: item.belgeler ?? [],
        ilkHafta: item.ilkHafta ?? [true, true, true, true, true, false, false],
        devamHafta: item.devamHafta ?? [true, true, true, true, true, false, false],
        sonHafta: item.sonHafta ?? [true, true, true, true, true, false, false],
      })),
    }
  } catch {
    return structuredClone(seedState)
  }
}

let state: AppState = loadState()
const listeners = new Set<() => void>()

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function resetDemoData() {
  state = structuredClone(seedState)
  persist()
}

export function updateEmployer(employer: Employer) {
  state = { ...state, employer }
  persist()
}

export function upsertProgram(program: Program) {
  const exists = state.programs.some((item) => item.id === program.id)
  state = {
    ...state,
    programs: exists
      ? state.programs.map((item) => (item.id === program.id ? program : item))
      : [program, ...state.programs],
  }
  persist()
}

export function deleteProgram(id: string) {
  state = {
    ...state,
    programs: state.programs.filter((item) => item.id !== id),
    trainees: state.trainees.filter((item) => item.programId !== id),
    jobStarts: state.jobStarts.filter((item) => item.programId !== id),
  }
  persist()
}

export function upsertTrainee(trainee: Trainee) {
  const exists = state.trainees.some((item) => item.id === trainee.id)
  state = {
    ...state,
    trainees: exists
      ? state.trainees.map((item) => (item.id === trainee.id ? trainee : item))
      : [trainee, ...state.trainees],
  }
  persist()
}

export function deleteTrainee(id: string) {
  state = {
    ...state,
    trainees: state.trainees.filter((item) => item.id !== id),
    jobStarts: state.jobStarts.filter((item) => item.traineeId !== id),
    attendance: state.attendance.filter((item) => item.traineeId !== id),
  }
  persist()
}

export function upsertJobStart(jobStart: JobStart) {
  const exists = state.jobStarts.some((item) => item.id === jobStart.id)
  const trainees = state.trainees.map((trainee) => {
    if (trainee.id !== jobStart.traineeId) return trainee
    if (trainee.status === 'tamamlandi' || trainee.status === 'ayrildi') {
      return trainee
    }
    return { ...trainee, status: 'isbasi' as const }
  })
  state = {
    ...state,
    jobStarts: exists
      ? state.jobStarts.map((item) => (item.id === jobStart.id ? jobStart : item))
      : [jobStart, ...state.jobStarts],
    trainees,
  }
  persist()
}

export function deleteJobStart(id: string) {
  state = {
    ...state,
    jobStarts: state.jobStarts.filter((item) => item.id !== id),
  }
  persist()
}

export function upsertAttendance(record: AttendanceRecord) {
  const exists = state.attendance.find(
    (item) => item.traineeId === record.traineeId && item.tarih === record.tarih,
  )
  state = {
    ...state,
    attendance: exists
      ? state.attendance.map((item) =>
          item.traineeId === record.traineeId && item.tarih === record.tarih
            ? { ...record, id: exists.id }
            : item,
        )
      : [record, ...state.attendance],
  }
  persist()
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === '1'
}

export function login(username: string, password: string) {
  if (username.trim() === 'isveren' && password === 'demo123') {
    localStorage.setItem(AUTH_KEY, '1')
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
