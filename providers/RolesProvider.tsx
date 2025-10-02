'use client'

import React, { createContext, useContext } from 'react'
import { RoleSlug } from '@/lib/rbac'

const RolesContext = createContext<RoleSlug[]>([])

export function RolesProvider({
	roles,
	children,
}: {
	roles: RoleSlug[]
	children: React.ReactNode
}) {
	return <RolesContext.Provider value={roles}>{children}</RolesContext.Provider>
}

export function useRoles() {
	return useContext(RolesContext)
}
