'use client'

import { createContext, useContext } from 'react'
import { UserMinimal } from '@/store/features/auth/authTypes'

const SessionCtx = createContext<UserMinimal>(null)

export function AuthSessionProvider({
	value,
	children,
}: {
	value: UserMinimal
	children: React.ReactNode
}) {
	return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}

export function useAuthSession() {
	return useContext(SessionCtx)
}
