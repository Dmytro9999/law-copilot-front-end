'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordField from '@/components/auth/PasswordField'
import { useLoginMutation } from '@/store/features/auth/authApi'
import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import { Brain, Mail, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { setUser } from '@/store/features/auth/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useI18n, useLocale } from '@/providers/I18nProvider'

export default function LoginClient() {
	const { t } = useI18n()
	const lang = useLocale()

	const router = useRouter()
	const { toast } = useToast()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [login, { data, isLoading }] = useLoginMutation()
	const dispatch = useAppDispatch()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const response = await login({
				email: email.trim(),
				password: password.trim(),
			}).unwrap()
			if ('requires2fa' in response && response.requires2fa) {
				sessionStorage.setItem('twoFaToken', response.twoFaToken)
				router.push(`${lang}/two-factor`)
				router.refresh()

				const nextUrl = `/${lang}/two-factor`
				window.location.replace(nextUrl)
				return
			}
			dispatch(setUser(response))
			sessionStorage.removeItem('twoFaToken')
			router.push(`/${lang}`)
			router.refresh()
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || 'Ошибка входа'
			toast({ title: 'Ошибка', description: msg, variant: 'destructive' })
		}
	}

	return (
		<>
			<AuthBrand />
			<AuthCard title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
				<form onSubmit={onSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
							{t('auth.login.emailLabel')}
						</Label>
						<div className='relative'>
							<Mail className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='email'
								type='email'
								placeholder={t('auth.login.emailPlaceholder')}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className='h-12 pr-10 bg-white/70 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
								required
							/>
						</div>
					</div>

					<PasswordField value={password} onChange={setPassword} />

					<Button
						type='submit'
						disabled={isLoading}
						className='w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
					>
						{isLoading ? (
							<div className='flex items-center gap-2'>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
								{t('auth.login.loading')}
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4' />
								{t('auth.login.button')}
							</div>
						)}
					</Button>
				</form>

				<div className='mt-6 space-y-3 text-center'>
					<Link
						className='text-slate-600 hover:text-slate-800 text-sm'
						href={`/${lang}/forgot-password`}
					>
						{t('auth.login.forgot')}
					</Link>
					<div>
						<Link
							className='text-blue-600 hover:text-blue-700'
							href={`/${lang}/signup`}
						>
							{t('auth.login.signup')}
						</Link>
					</div>
				</div>
			</AuthCard>

			{/* Features */}
			<div className='mt-8 grid grid-cols-3 gap-4 text-center'>
				<div className='bg-white/60 backdrop-blur-sm rounded-lg p-3'>
					<Brain className='h-6 w-6 text-blue-600 mx-auto mb-1' />
					<p className='text-xs text-slate-600 font-medium'>
						{t('auth.login.features.ai')}
					</p>
				</div>
				<div className='bg-white/60 backdrop-blur-sm rounded-lg p-3'>
					<Shield className='h-6 w-6 text-green-600 mx-auto mb-1' />
					<p className='text-xs text-slate-600 font-medium'>
						{t('auth.login.features.security')}
					</p>
				</div>
				<div className='bg-white/60 backdrop-blur-sm rounded-lg p-3'>
					<Sparkles className='h-6 w-6 text-purple-600 mx-auto mb-1' />
					<p className='text-xs text-slate-600 font-medium'>
						{t('auth.login.features.automation')}
					</p>
				</div>
			</div>

			{/* Legal Notice */}
			<div className='mt-6 text-center'>
				<p className='text-xs text-slate-500'>
					{t('auth.login.legal.prefix')}{' '}
					<Button variant='link' className='text-xs p-0 h-auto text-blue-600'>
						{t('auth.login.legal.terms')}
					</Button>{' '}
					{t('auth.login.legal.and')}{' '}
					<Button variant='link' className='text-xs p-0 h-auto text-blue-600'>
						{t('auth.login.legal.privacy')}
					</Button>
				</p>
			</div>
		</>
	)
}
