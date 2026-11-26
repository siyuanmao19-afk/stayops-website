import { afterEach, describe, expect, it, vi } from 'vitest'
import { getUser } from '@netlify/identity'
import { createRecord, listRecords } from '../../netlify/functions/_lib/softr.mts'

vi.mock('@netlify/identity', () => ({ getUser: vi.fn(), admin: { listUsers: vi.fn() } }))
vi.mock('../../netlify/functions/_lib/softr.mts', () => ({
  createRecord: vi.fn(),
  listRecords: vi.fn(),
  tableId: vi.fn(),
  FIELD_IDS: { users: { user_id: 'user_id', name: 'name', email: 'email', role: 'role' } },
}))

import { ownsTask, visibleTasks, session, uniqueUsersByEmail } from '../../netlify/functions/_lib/access.mts'
import { activityLog } from '../../netlify/functions/_lib/normalise.mts'

type Viewer = NonNullable<Awaited<ReturnType<typeof session>>>

const employee = { email: 'employee@example.com', manager: false, profile: { record_id: 'user-1' } } as Viewer
const otherEmployee = { email: 'other@example.com', manager: false, profile: { record_id: 'user-2' } } as Viewer
const manager = { email: 'siyuanmao19@gmail.com', manager: true, profile: null } as unknown as Viewer

afterEach(() => vi.clearAllMocks())

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

  it('shows one employee per email and keeps the oldest profile', () => {
    const rows = [
      { id: 'new', fields: { name: 'New', email: 'STAFF@example.com' }, createdAt: '2026-11-19T11:46:33Z', updatedAt: '' },
      { id: 'old', fields: { name: 'Old', email: 'staff@example.com' }, createdAt: '2026-11-19T11:46:32Z', updatedAt: '' },
    ]
    expect(uniqueUsersByEmail(rows)).toEqual([expect.objectContaining({ record_id: 'old', email: 'staff@example.com' })])
  })

  it('uses one profile creation for simultaneous first requests', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'identity-1', email: 'staff@example.com', name: 'Staff' } as never)
    vi.mocked(listRecords).mockResolvedValue([])
    vi.mocked(createRecord).mockResolvedValue({ id: 'profile-1', fields: { user_id: 'identity-1', email: 'staff@example.com' }, createdAt: '', updatedAt: '' })
    const [first, second] = await Promise.all([session(), session()])
    expect(createRecord).toHaveBeenCalledTimes(1)
    expect(createRecord).toHaveBeenCalledWith(undefined, expect.objectContaining({ role: 'Staff' }))
    expect(first?.profile?.record_id).toBe('profile-1')
    expect(second?.profile?.record_id).toBe('profile-1')
  })

  it('keeps tasks linked to either duplicate profile visible to their employee', () => {
    const viewer = { ...employee, profileRecordIds: ['user-1', 'user-duplicate'] } as Viewer
    expect(ownsTask(viewer, 'U001', 'user-duplicate')).toBe(true)
    expect(ownsTask(otherEmployee, 'U001', 'user-duplicate')).toBe(false)
  })
  it('lets a signed-in employee see tasks linked to an older profile with the same email', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'identity-new', email: 'staff@example.com' } as never)
    vi.mocked(listRecords).mockResolvedValue([
      { id: 'profile-old', fields: { user_id: 'identity-old', email: 'staff@example.com' }, createdAt: '2026-11-20T00:00:00Z', updatedAt: '' },
      { id: 'profile-new', fields: { user_id: 'identity-new', email: 'staff@example.com' }, createdAt: '2026-11-20T01:00:00Z', updatedAt: '' },
      { id: 'other-person', fields: { user_id: 'identity-other', email: 'other@example.com' }, createdAt: '2026-11-20T02:00:00Z', updatedAt: '' },
    ])
    const viewer = await session()
    expect(viewer?.profileRecordIds).toEqual(['profile-old', 'profile-new'])
    expect(ownsTask(viewer!, 'identity-old', 'profile-old')).toBe(true)
    expect(ownsTask(viewer!, 'identity-other', 'other-person')).toBe(false)
  })

})
