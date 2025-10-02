'use client'

import { PropsWithChildren } from 'react'
import { useAuthSession } from '@/providers/AuthSessionProvider'
import { can } from '@/lib/rbac'

export function Can({
	action,
	children,
	fallback = null,
}: PropsWithChildren<{ action: string; fallback?: React.ReactNode }>) {
	const user = useAuthSession()
	if (!user) return null
	return can(action, user.roles) ? <>{children}</> : <>{fallback}</>
}

export function useCan(action: string) {
	const user = useAuthSession()
	return !!user && can(action, user.roles)
}
