import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LayoutShell from '@/components/Layouts/AuthLayout/LayoutShell'
export default function PrivateLayout({ children }: { children: ReactNode }) {
	return <LayoutShell>{children}</LayoutShell>
}
