self.addEventListener('push', (event) => {
  if (!event.data) return
  const message = event.data.json()
  event.waitUntil(self.registration.showNotification(message.title || 'StayOps', {
    body: message.body || '你有一项新任务',
    data: { url: message.url || '/app/tasks' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destination = new URL(event.notification.data?.url || '/app/tasks', self.location.origin)
  if (destination.origin !== self.location.origin) return
  event.waitUntil(clients.openWindow(destination.href))
})
