'use client'

import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initAuth } from '@/store/features/auth/initAuth'
import authSelectors from '@/store/features/auth/authSelectors'

export default function AuthInit() {
    const dispatch = useAppDispatch()

    const initialized = useAppSelector(authSelectors.selectAuthInitialized)
    const once = useRef(false)

    useEffect(() => {
        if (!once.current) {
            once.current = true
            dispatch(initAuth())
        } else if (!initialized) {
            dispatch(initAuth())
        }
    }, [dispatch, initialized])

    return null
}
