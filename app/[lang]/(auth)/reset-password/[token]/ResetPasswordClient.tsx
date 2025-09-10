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
import { useI18n, useLocale } from '@/providers/I18nProvider'

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
	const { t } = useI18n()
	const lang = useLocale()

	const [emailState, setEmailState] = useState(email ?? '')
	const [pw, setPw] = useState('')
	const [pw2, setPw2] = useState('')

	const [confirmReset, { isLoading }] = useConfirmResetPasswordMutation()
	const [login, { isLoading: isLoggingIn }] = useLoginMutation()

	function resolveNext(target: string, lang: string) {
		if (!target || typeof target !== 'string') return `/${lang}`
		if (/^https?:\/\//i.test(target)) return target
		if (
			target.startsWith('/he/') ||
			target === '/he' ||
			target.startsWith('/en/') ||
			target === '/en'
		) {
			return target
		}
		return target.startsWith('/') ? `/${lang}${target}` : `/${lang}`
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!emailState) {
			toast({
				title: t('reset.toast.errorTitle'),
				description: t('reset.toast.emailRequired'),
				variant: 'destructive',
			})
			return
		}
		if (!pw || pw.length < 8) {
			toast({
				title: t('reset.toast.errorTitle'),
				description: t('reset.toast.pwMin'),
				variant: 'destructive',
			})
			return
		}
		if (pw !== pw2) {
			toast({
				title: t('reset.toast.errorTitle'),
				description: t('reset.toast.pwMismatch'),
				variant: 'destructive',
			})
			return
		}

		try {
			await confirmReset({ email: emailState.trim(), password: pw, token }).unwrap()
			await login({ email: emailState.trim(), password: pw }).unwrap()

			toast({
				title: t('reset.toast.successTitle'),
				description: t('reset.toast.successDesc'),
				className: 'bg-green-600 text-white',
			})

			const dest = resolveNext(next, lang)
			window.location.replace(dest)
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('reset.toast.defaultError')
			toast({ title: t('reset.toast.errorTitle'), description: msg, variant: 'destructive' })
		}
	}

	return (
		<>
			<AuthBrand />
			<AuthCard title={t('reset.title')} subtitle={t('reset.subtitle')}>
				<form onSubmit={onSubmit} className='space-y-4'>
					{!email && (
						<div className='space-y-2'>
							<Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
								{t('reset.emailLabel')}
							</Label>
							<Input
								id='email'
								type='email'
								value={emailState}
								onChange={(e) => setEmailState(e.target.value)}
								placeholder={t('reset.emailPlaceholder')}
								required
							/>
						</div>
					)}

					<PasswordField
						id='pw'
						label={t('reset.newPasswordLabel')}
						value={pw}
						onChange={setPw}
					/>
					<PasswordField
						id='pw2'
						label={t('reset.confirmPasswordLabel')}
						value={pw2}
						onChange={setPw2}
					/>

					<Button
						type='submit'
						disabled={isLoading || isLoggingIn}
						className='w-full h-12'
					>
						{isLoading || isLoggingIn ? t('reset.saving') : t('reset.submit')}
					</Button>
				</form>
			</AuthCard>
		</>
	)
}
