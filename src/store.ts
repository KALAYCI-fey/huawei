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

const STORAGE_KEY = 'iskur-isbasi-state-v4'
const AUTH_KEY = 'iskur-isbasi-auth'
const FIRMA_KEY = 'iskur-isbasi-firma'

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
        tatilGunleri: item.tatilGunleri ?? [],
      })),
    }
  } catch {
    return structuredClone(seedState)
  }
}

let state: AppState = loadState()
const listeners = new Set<() => void>()

function persist() {
  try {
    const copy = structuredClone(state)
    copy.programs = copy.programs.map((program) => ({
      ...program,
      belgeler: program.belgeler.map((doc) => ({
        ...doc,
        dataUrl: doc.dataUrl && doc.dataUrl.length > 200_000 ? '' : doc.dataUrl,
      })),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy))
  } catch {
    /* quota or private mode — keep in-memory state */
  }
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
  return localStorage.getItem(AUTH_KEY) === '1' && Boolean(localStorage.getItem(FIRMA_KEY))
}

export function credentialsOk(tcKimlikNo: string, password: string) {
  const tc = tcKimlikNo.replace(/\D/g, '')
  return tc === '10618552648' && password === '632571aH.'
}

export function completeEmployerLogin(firmaId: string) {
  if (!firmaId) return false
  localStorage.setItem(AUTH_KEY, '1')
  localStorage.setItem(FIRMA_KEY, firmaId)
  return true
}

export function getSelectedFirmaId() {
  return localStorage.getItem(FIRMA_KEY) ?? ''
}

export function setSelectedFirmaId(id: string) {
  localStorage.setItem(FIRMA_KEY, id)
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(FIRMA_KEY)
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
