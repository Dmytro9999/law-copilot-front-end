'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import { useToast } from '@/components/ui/use-toast'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'

import { useResetPasswordSendEmailMutation } from '@/store/features/auth/authApi'

export default function ForgotPasswordPage() {
	const router = useRouter()
	const { toast } = useToast()
	const [email, setEmail] = useState('')
	const [openSuccess, setOpenSuccess] = useState(false)

	const [sendReset, { isLoading }] = useResetPasswordSendEmailMutation()

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!email) return

		try {
			await sendReset({ email: email.trim() }).unwrap()
			setOpenSuccess(true)
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || 'אירעה שגיאה, נסה שוב'
			toast({ title: 'שגיאה', description: msg, variant: 'destructive' })
		}
	}

	const handleSuccessOpenChange = (open: boolean) => {
		setOpenSuccess(open)
		if (!open) router.replace('/login')
	}

	return (
		<>
			<AuthBrand />
			<AuthCard title='איפוס סיסמה' subtitle='הזן את כתובת המייל שלך לקבלת קישור לאיפוס'>
				<form onSubmit={onSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label
							htmlFor='reset-email'
							className='text-sm font-semibold text-slate-700'
						>
							כתובת מייל
						</Label>
						<div className='relative'>
							<Mail className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='reset-email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='lawyer@example.com'
								className='h-12 pr-10 bg-white/70 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
								required
							/>
						</div>
					</div>

					<Button
						type='submit'
						disabled={isLoading}
						className='w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
					>
						{isLoading ? (
							<div className='flex items-center gap-2'>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
								שולח...
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<Mail className='h-4 w-4' />
								שלח קישור לאיפוס
							</div>
						)}
					</Button>
				</form>

				<div className='mt-6 text-center'>
					<Link className='text-blue-600 hover:text-blue-700' href='/login'>
						חזור להתחברות
					</Link>
				</div>
			</AuthCard>

			<Dialog open={openSuccess} onOpenChange={handleSuccessOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>קישור לאיפוס נשלח</DialogTitle>
						<DialogDescription>
							נשלחה לכתובת הדוא"ל שלך דוא"ל עם הוראות שחזור סיסמה
						</DialogDescription>
					</DialogHeader>
					<div className='flex justify-end'>
						<Button onClick={() => handleSuccessOpenChange(false)}>אישור</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
