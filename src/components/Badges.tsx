import type { IskurBildirimDurumu, ProgramStatus, TraineeStatus } from '../types'
import {
  bildirimLabel,
  programStatusLabel,
  traineeStatusLabel,
} from '../format'

function classForProgram(status: ProgramStatus) {
  if (status === 'devam' || status === 'onaylandi') return 'badge-ok'
  if (status === 'basvuru' || status === 'taslak') return 'badge-warn'
  if (status === 'iptal') return 'badge-danger'
  return 'badge-muted'
}

function classForTrainee(status: TraineeStatus) {
  if (status === 'devam' || status === 'isbasi') return 'badge-ok'
  if (status === 'onaylandi' || status === 'aday') return 'badge-info'
  if (status === 'ayrildi') return 'badge-danger'
  return 'badge-muted'
}

function classForBildirim(status: IskurBildirimDurumu) {
  if (status === 'onaylandi') return 'badge-ok'
  if (status === 'e_sube_isaretlendi' || status === 'hazir') return 'badge-info'
  return 'badge-warn'
}

export function ProgramBadge({ status }: { status: ProgramStatus }) {
  return <span className={`badge ${classForProgram(status)}`}>{programStatusLabel(status)}</span>
}

export function TraineeBadge({ status }: { status: TraineeStatus }) {
  return <span className={`badge ${classForTrainee(status)}`}>{traineeStatusLabel(status)}</span>
}

export function BildirimBadge({ status }: { status: IskurBildirimDurumu }) {
  return <span className={`badge ${classForBildirim(status)}`}>{bildirimLabel(status)}</span>
}
