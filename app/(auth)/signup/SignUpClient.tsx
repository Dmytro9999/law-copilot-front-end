'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, User, Building, Phone, Shield } from 'lucide-react'
import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import PasswordField from '@/components/auth/PasswordField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useSignUpMutation } from '@/store/features/auth/authApi'
import {setUser} from '@/store/features/auth/authSlice'
import {useAppDispatch} from '@/store/hooks'

export default function SignUpClient() {
    const { toast } = useToast()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [lawFirm, setLawFirm] = useState('')
    const [phone, setPhone] = useState('')
    const [signUp, { isLoading }] = useSignUpMutation()
    const dispatch = useAppDispatch();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const response = await signUp({ email: email.trim(), password: password.trim(), name: fullName.trim(), lawFirm: lawFirm.trim(), phone: phone.trim() }).unwrap()

            dispatch(setUser(response))
            router.replace( '/')
            toast({
                title: 'נרשמת בהצלחה! 📧',
                description: 'אנא בדוק את המייל שלך לאימות החשבון',
                className: 'bg-gradient-to-l from-blue-500 to-purple-600 text-white border-none',
            })
        } catch (err: any) {
            const msg = err?.data?.message || err?.message || 'אירעה שגיאה, נסה שוב'
            toast({ title: 'שגיאה', description: msg, variant: 'destructive' })
        }
    }

    return (
        <>
            <AuthBrand />
            <AuthCard title="הרשמה למערכת" subtitle="צור חשבון חדש למשרד עורכי הדין">
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                        המערכת מיועדת לעורכי דין בלבד. נדרש אימות מקצועי.
                    </AlertDescription>
                </Alert>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">שם מלא *</Label>
                        <div className="relative">
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="עו״ד דוד כהן" required className="h-12 pr-10" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lawFirm" className="text-sm font-semibold text-slate-700">משרד עורכי דין *</Label>
                        <div className="relative">
                            <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="lawFirm" value={lawFirm} onChange={(e) => setLawFirm(e.target.value)} placeholder="משרד כהן ושות׳" required className="h-12 pr-10" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">טלפון *</Label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" required className="h-12 pr-10" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">כתובת מייל *</Label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lawyer@example.com" required className="h-12 pr-10" />
                        </div>
                    </div>

                    <PasswordField value={password} onChange={setPassword} helper="הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר" />

                    <Button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                נרשם...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                הרשם למערכת
                            </div>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link className="text-blue-600 hover:text-blue-700" href="/login">יש לך חשבון? התחבר כאן</Link>
                </div>
            </AuthCard>
        </>
    )
}
