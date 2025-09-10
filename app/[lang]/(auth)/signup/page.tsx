import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignUpClient from './SignUpClient'


export default async function SignUpPage() {
    const cookieStore = await cookies()
    const hasAuth = Boolean(cookieStore.get('Authentication')?.value)
    if (hasAuth) redirect('/')


    return <SignUpClient />
}


