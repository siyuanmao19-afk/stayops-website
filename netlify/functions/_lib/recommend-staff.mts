type Staff = { record_id: string; email: string; property_id: string }
type Task = { assigned_user_record_id: string; status: string }

export function recommendStaff<T extends Staff>(staff: T[], tasks: Task[], propertyId: string, modelEmail: string) {
  const eligible = staff.filter((item) => !item.property_id || item.property_id === propertyId)
  const modelChoice = eligible.find((item) => item.email.toLowerCase() === modelEmail.trim().toLowerCase())
  if (modelChoice) return { employee: modelChoice, fallback: false }

  const openCount = (recordId: string) => tasks.filter((task) => task.assigned_user_record_id === recordId && task.status !== 'Resolved').length
  const employee = [...eligible].sort((left, right) =>
    Number(right.property_id === propertyId) - Number(left.property_id === propertyId)
    || openCount(left.record_id) - openCount(right.record_id)
    || left.email.localeCompare(right.email),
  )[0]
  return { employee, fallback: Boolean(employee) }
}
