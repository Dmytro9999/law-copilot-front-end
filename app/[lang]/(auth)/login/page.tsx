import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LoginClient from './LoginClient'

type SearchParams = Promise<{ next?: string | string[] }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
    const cookieStore = await cookies()
    const hasAuth = Boolean(cookieStore.get('Authentication')?.value)
    if (hasAuth) redirect('/')
    return <LoginClient />
}
