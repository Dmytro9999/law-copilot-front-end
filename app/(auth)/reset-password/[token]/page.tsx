import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import environment from '@/config'
import ResetPasswordClient from './ResetPasswordClient'

type Params = { params: { token: string }, searchParams: Promise<{ next?: string | string[] }> }

function normalizeNext(next?: string | string[]) {
    const raw = Array.isArray(next) ? next[0] : next
    if (!raw) return '/'
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) return '/'
    return raw
}

async function verifyTokenServer(token: string) {
    const res = await fetch(
        `${environment.BASE_URL}/reset-password/${encodeURIComponent(token)}/is-expired`,
        { cache: 'no-store' }
    )
    if (!res.ok) return null
    return res.json() as Promise<{ token: string; email?: string }>
}

export default async function Page({ params, searchParams }: Params) {
    const cookieStore = await cookies()
    if (cookieStore.get('Authentication')?.value) redirect('/')

    const sp = await searchParams
    const nextSafe = normalizeNext(sp.next)

    const tokenInfo = await verifyTokenServer(params.token)
    if (!tokenInfo) {
        return (
            <div className="min-h-screen grid place-items-center p-8 text-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2">הקישור אינו תקין או שפג תוקפו</h1>
                    <p className="text-slate-600">נסה לבקש קישור חדש לאיפוס הסיסמה.</p>
                </div>
            </div>
        )
    }

    return <ResetPasswordClient token={tokenInfo.token} email={tokenInfo.email} next={nextSafe} />
}
