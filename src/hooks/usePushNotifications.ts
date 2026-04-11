import { useState, useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messaging, isFirebaseEnabled } from '../services/firebase'
import { useAuthStore } from '../stores/authStore'
import { notificationsAPI } from '../services/api'
import { toast } from 'react-hot-toast'

export const usePushNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission)
    const [fcmToken, setFcmToken] = useState<string | null>(null)
    const { user } = useAuthStore()

    useEffect(() => {
        if (Notification.permission === 'granted' && isFirebaseEnabled && messaging) {
            requestToken()
        }
    }, [user])

    const requestPermission = async () => {
        if (!isFirebaseEnabled || !messaging) {
            toast.error('Notification service is not configured')
            return
        }

        try {
            const permission = await Notification.requestPermission()
            setPermission(permission)

            if (permission === 'granted') {
                await requestToken()
                toast.success('تم تفعيل الإشعارات بنجاح')
            } else {
                toast.error('تم رفض الإذن للإشعارات')
            }
        } catch (error) {
            console.error('Error requesting permission:', error)
            toast.error('حدث خطأ أثناء طلب الإذن')
        }
    }

    const requestToken = async () => {
        if (!messaging || !user) return

        try {
            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            })

            if (currentToken) {
                setFcmToken(currentToken)
                // Send token to server
                await notificationsAPI.registerPushToken(currentToken)
            } else {
                console.log('No registration token available. Request permission to generate one.')
            }
        } catch (err) {
            console.log('An error occurred while retrieving token. ', err)
        }
    }

    return {
        permission,
        requestPermission,
        fcmToken
    }
}
