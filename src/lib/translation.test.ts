import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DashboardData } from './domain'
import { dashboardTexts, translateDashboard, translateForDisplay } from './translation'

afterEach(() => vi.unstubAllGlobals())

describe('display translation', () => {
  it('translates legacy Chinese task text for English mode without changing nationality', async () => {
    const data: DashboardData = {
      properties: [{ record_id: 'rec-p', property_id: 'P-1', name: '西湖茶舍', city: '杭州', province: '浙江', location: '杭州, 浙江', image_url: '', status: 'Operating' }],
      users: [], procedures: [], activityLogs: [],
      tasks: [{ record_id: 'rec-t', id: 'T-1', title: '需要毛巾', description: '', property_id: 'P-1', task_type: 'Housekeeping', ai_summary: '', priority: 'Normal', priority_reason: '', recommended_staff_email: '', assignment_reason: '', procedure_id: '', ai_recommendation: '', draft_response: '', assigned_to: 'Unassigned', assigned_user_record_id: '', status: 'Open', urgent: false, created_at: '' }],
      customers: [{ record_id: 'rec-c', id_number: '', phone_number: '', room_number: '', property_number: 'P-1', nationality: 'Japanese', stay_start: '', stay_end: '', duration_days: 1 }],
      loadedAt: '',
    }
    expect(dashboardTexts(data, 'en')).toContain('需要毛巾')
    expect(dashboardTexts(data, 'en')).not.toContain('Japanese')
    expect(dashboardTexts(data, 'zh')).not.toContain('Unassigned')

    const fetchMock = vi.fn(async (_url: string, _options: RequestInit) => ({
      ok: true,
      json: async () => ({ data: { translations: { '需要毛巾': 'Extra towels needed' } } }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const translations = await translateForDisplay(['需要毛巾'], 'en')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).target).toBe('en')

    const shown = translateDashboard(data, (text) => text === 'Unassigned' ? '未分配' : translations[text] ?? text)
    expect(shown.tasks[0].title).toBe('Extra towels needed')
    expect(shown.tasks[0].assigned_to).toBe('Unassigned')
    expect(shown.customers[0].nationality).toBe('Japanese')
  })
})
