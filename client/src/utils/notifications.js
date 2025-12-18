// Push notification utilities
import { API_URL } from '../api'

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration.scope)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }
  return null
}

export async function subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Get VAPID public key from server
    const response = await fetch(`${API_URL}/api/push/vapid-key`)
    const { publicKey } = await response.json()

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    // Send subscription to server
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    })

    return true
  } catch (error) {
    console.error('Push subscription failed:', error)
    return false
  }
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
    }

    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return true
  } catch (error) {
    console.error('Push unsubscribe failed:', error)
    return false
  }
}

export async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

