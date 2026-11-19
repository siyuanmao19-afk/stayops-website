import { describe, expect, it, vi } from 'vitest'

vi.mock('@netlify/identity', () => ({ getUser: vi.fn(), admin: { listUsers: vi.fn() } }))
vi.mock('../../netlify/functions/_lib/softr.mts', () => ({
  createRecord: vi.fn(),
  listRecords: vi.fn(),
  tableId: vi.fn(),
  FIELD_IDS: { users: {} },
}))

import { ownsTask, visibleTasks, session } from '../../netlify/functions/_lib/access.mts'
import { activityLog } from '../../netlify/functions/_lib/normalise.mts'

type Viewer = NonNullable<Awaited<ReturnType<typeof session>>>

const employee = { email: 'employee@example.com', manager: false, profile: { record_id: 'user-1' } } as Viewer
const otherEmployee = { email: 'other@example.com', manager: false, profile: { record_id: 'user-2' } } as Viewer
const manager = { email: 'siyuanmao19@gmail.com', manager: true, profile: null } as unknown as Viewer

describe('task access', () => {
  it('uses the linked Softr employee record to isolate tasks', () => {
    expect(ownsTask(employee, 'U001', 'user-1')).toBe(true)
    expect(ownsTask(otherEmployee, 'U001', 'user-1')).toBe(false)
    expect(ownsTask(manager, 'U001', 'user-1')).toBe(true)
  })

  it('keeps unassigned tasks visible only to the manager', () => {
    const rows = [
      { id: 'task-1', fields: { task_id: 'T001', assigned_to: { id: 'user-1', label: 'U001' } }, createdAt: '', updatedAt: '' },
      { id: 'task-2', fields: { task_id: 'T002' }, createdAt: '', updatedAt: '' },
    ]
    expect(visibleTasks(employee, rows).map((task) => task.id)).toEqual(['T001'])
    expect(visibleTasks(otherEmployee, rows)).toEqual([])
    expect(visibleTasks(manager, rows)).toHaveLength(2)
  })

  it('uses the linked task record for notification routing', () => {
    const log = activityLog({
      id: 'log-1',
      fields: { task_id: { id: 'task-1', label: 'T001' }, action: 'Manager assigned task to employee@example.com.' },
      createdAt: '', updatedAt: '',
    })
    expect(log.task_id).toBe('T001')
    expect(log.task_record_id).toBe('task-1')
  })
})
