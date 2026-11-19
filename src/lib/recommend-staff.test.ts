import { describe, expect, it } from 'vitest'
import { recommendStaff } from '../../netlify/functions/_lib/recommend-staff.mts'

const staff = [
  { record_id: 'busy', email: 'busy@example.com', property_id: '' },
  { record_id: 'free', email: 'free@example.com', property_id: '' },
  { record_id: 'other-property', email: 'other@example.com', property_id: 'P-2' },
]

describe('staff recommendation', () => {
  it('keeps a valid AI recommendation for the selected property', () => {
    expect(recommendStaff(staff, [], 'P-1', 'busy@example.com')).toEqual({ employee: staff[0], fallback: false })
  })

  it('chooses an eligible employee with fewer open tasks when AI gives no name', () => {
    const tasks = [{ assigned_user_record_id: 'busy', status: 'Open' }, { assigned_user_record_id: 'free', status: 'Resolved' }]
    expect(recommendStaff(staff, tasks, 'P-1', '').employee?.email).toBe('free@example.com')
  })

  it('ignores a model choice assigned to another property', () => {
    expect(recommendStaff(staff, [], 'P-1', 'other@example.com').employee?.email).not.toBe('other@example.com')
  })
})
