import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TwoFactor from './TwoFactor'

export default async function TwoFactorPage() {
	const cookieStore = await cookies()
	const hasAuth = Boolean(cookieStore.get('Authentication')?.value)
	if (hasAuth) redirect('/')

	return <TwoFactor />
}
