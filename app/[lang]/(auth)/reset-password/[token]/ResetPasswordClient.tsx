'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import PasswordField from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useConfirmResetPasswordMutation, useLoginMutation } from '@/store/features/auth/authApi'

export default function ResetPasswordClient({
                                                token,
                                                email,
                                                next,
                                            }: {
    token: string
    email?: string
    next: string
}) {
    const router = useRouter()
    const { toast } = useToast()

    // если бэк не вернул email — попросим пользователя ввести
    const [emailState, setEmailState] = useState(email ?? '')
    const [pw, setPw] = useState('')
    const [pw2, setPw2] = useState('')

    const [confirmReset, { isLoading }] = useConfirmResetPasswordMutation()
    const [login, { isLoading: isLoggingIn }] = useLoginMutation()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!emailState) {
            toast({ title: 'שגיאה', description: 'נא להזין כתובת מייל', variant: 'destructive' })
            return
        }
        if (!pw || pw.length < 8) {
            toast({ title: 'שגיאה', description: 'הסיסמה חייבת להכיל לפחות 8 תווים', variant: 'destructive' })
            return
        }
        if (pw !== pw2) {
            toast({ title: 'שגיאה', description: 'הסיסמאות אינן תואמות', variant: 'destructive' })
            return
        }

        try {
            await confirmReset({ email: emailState.trim(), password: pw, token }).unwrap()
            await login({ email: emailState.trim(), password: pw }).unwrap()

            toast({
                title: 'הסיסמה עודכנה',
                description: 'התחברת בהצלחה',
                className: 'bg-green-600 text-white',
            })
            router.replace(next || '/')
        } catch (err: any) {
            const msg = err?.data?.message || err?.message || 'אירעה שגיאה, נסה שוב'
            toast({ title: 'שגיאה', description: msg, variant: 'destructive' })
        }
    }

    return (
        <>
            <AuthBrand />
            <AuthCard title="איפוס סיסמה" subtitle="בחר סיסמה חדשה והתחבר">
                <form onSubmit={onSubmit} className="space-y-4">
                    {!email && (
                        <div className="space-y-2">
                            <Label htmlFor="email">כתובת מייל *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={emailState}
                                onChange={(e) => setEmailState(e.target.value)}
                                placeholder="lawyer@example.com"
                                required
                            />
                        </div>
                    )}

                    <PasswordField id="pw" label="סיסמה חדשה *" value={pw} onChange={setPw} />
                    <PasswordField id="pw2" label="אימות סיסמה *" value={pw2} onChange={setPw2} />

                    <Button type="submit" disabled={isLoading || isLoggingIn} className="w-full h-12">
                        {isLoading || isLoggingIn ? 'שומר…' : 'שנה סיסמה והתחבר'}
                    </Button>
                </form>
            </AuthCard>
        </>
    )
}
