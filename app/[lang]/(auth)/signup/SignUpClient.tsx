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
import { setUser } from '@/store/features/auth/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useI18n, useLocale } from '@/providers/I18nProvider'

export default function SignUpClient() {
	const { toast } = useToast()
	const router = useRouter()
	const dispatch = useAppDispatch()

	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [fullName, setFullName] = useState('')
	const [lawFirm, setLawFirm] = useState('')
	const [phone, setPhone] = useState('')

	const [signUp, { isLoading }] = useSignUpMutation()

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		try {
			const response = await signUp({
				email: email.trim(),
				password: password.trim(),
				name: fullName.trim(),
				lawFirm: lawFirm.trim(),
				phone: phone.trim(),
			}).unwrap()

			dispatch(setUser(response))

			toast({
				title: t('signup.toast.successTitle'),
				description: t('signup.toast.successDesc'),
				className: 'bg-gradient-to-l from-blue-500 to-purple-600 text-white border-none',
			})

			router.replace(`/${lang}`)
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('signup.toast.defaultError')
			toast({ title: t('signup.toast.errorTitle'), description: msg, variant: 'destructive' })
		}
	}

	return (
		<>
			<AuthBrand />

			<AuthCard title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
				<Alert className='mb-6 bg-blue-50 border-blue-200'>
					<AlertDescription className='text-blue-800'>
						{t('auth.signup.alert')}
					</AlertDescription>
				</Alert>

				<form onSubmit={onSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='fullName' className='text-sm font-semibold text-slate-700'>
							{t('auth.signup.fields.fullNameLabel')}
						</Label>
						<div className='relative'>
							<User className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='fullName'
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder={t('auth.signup.fields.fullNamePlaceholder')}
								required
								className='h-12 pr-10'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='lawFirm' className='text-sm font-semibold text-slate-700'>
							{t('auth.signup.fields.lawFirmLabel')}
						</Label>
						<div className='relative'>
							<Building className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='lawFirm'
								value={lawFirm}
								onChange={(e) => setLawFirm(e.target.value)}
								placeholder={t('auth.signup.fields.lawFirmPlaceholder')}
								required
								className='h-12 pr-10'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='phone' className='text-sm font-semibold text-slate-700'>
							{t('auth.signup.fields.phoneLabel')}
						</Label>
						<div className='relative'>
							<Phone className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='phone'
								type='tel'
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder={t('auth.signup.fields.phonePlaceholder')}
								required
								className='h-12 pr-10'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
							{t('auth.signup.fields.emailLabel')}
						</Label>
						<div className='relative'>
							<Mail className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t('auth.signup.fields.emailPlaceholder')}
								required
								className='h-12 pr-10'
							/>
						</div>
					</div>

					<PasswordField
						value={password}
						onChange={setPassword}
						helper={t('auth.signup.passwordHelper')}
					/>

					<Button
						type='submit'
						disabled={isLoading}
						className='w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
					>
						{isLoading ? (
							<div className='flex items-center gap-2'>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
								{t('auth.signup.submitting')}
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4' />
								{t('auth.signup.submit')}
							</div>
						)}
					</Button>
				</form>

				<div className='mt-6 text-center'>
					<Link className='text-blue-600 hover:text-blue-700' href={`/${lang}/login`}>
						{t('auth.signup.footerLogin')}
					</Link>
				</div>
			</AuthCard>
		</>
	)
}
