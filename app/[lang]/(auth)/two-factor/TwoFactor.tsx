'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import { Mail, ShieldCheck, RefreshCw, Clock, ChevronLeft } from 'lucide-react'
import { useResend2faMutation, useVerify2faMutation } from '@/store/features/auth/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setUser } from '@/store/features/auth/authSlice'
import { useI18n, useLocale } from '@/providers/I18nProvider'

export default function TwoFactorPage() {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const { toast } = useToast()
	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'

	const [twoFaToken, setTwoFaToken] = useState<string>('')
	const [maskedEmail, setMaskedEmail] = useState<string>('')
	const [ttlSec, setTtlSec] = useState<number>(600)
	const [cooldown, setCooldown] = useState<number>(0)

	const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
	const inputsRef = useRef<Array<HTMLInputElement | null>>([])

	const code = useMemo(() => otp.join(''), [otp])

	const [verify2fa, { isLoading: isVerifying }] = useVerify2faMutation()
	const [resend2fa, { isLoading: isResending }] = useResend2faMutation()

	useEffect(() => {
		const tkn = sessionStorage.getItem('twoFaToken') || ''
		if (!tkn) {
			router.replace(`/${lang}/login`)
			return
		}
		setTwoFaToken(tkn)

		const masked = sessionStorage.getItem('twoFaMaskedEmail') || ''
		const ttl = Number(sessionStorage.getItem('twoFaTTL') || 600)
		const cd = Number(sessionStorage.getItem('twoFaCooldown') || 0)

		setMaskedEmail(masked)
		setTtlSec(Number.isFinite(ttl) ? ttl : 600)
		setCooldown(Number.isFinite(cd) ? cd : 0)
	}, [router, lang])

	useEffect(() => {
		if (cooldown <= 0) return
		const id = setInterval(() => setCooldown((s) => s - 1), 1000)
		return () => clearInterval(id)
	}, [cooldown])

	const onChangeCell = (idx: number, value: string) => {
		const v = value.replace(/\D/g, '').slice(-1)
		setOtp((prev) => {
			const next = [...prev]
			next[idx] = v
			return next
		})
		if (v && idx < 5) {
			inputsRef.current[idx + 1]?.focus()
		}
	}

	const onKeyDownCell = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace') {
			if (otp[idx]) {
				setOtp((prev) => {
					const next = [...prev]
					next[idx] = ''
					return next
				})
			} else if (idx > 0) {
				inputsRef.current[idx - 1]?.focus()
				setOtp((prev) => {
					const next = [...prev]
					next[idx - 1] = ''
					return next
				})
			}
		}
		if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus()
		if (e.key === 'ArrowRight' && idx < 5) inputsRef.current[idx + 1]?.focus()
	}

	const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
		if (!text) return
		e.preventDefault()
		const next = text.split('').concat(Array(6).fill('')).slice(0, 6)
		setOtp(next)
		const lastFilled = Math.min(
			5,
			next.findLastIndex((c) => !!c)
		)
		inputsRef.current[Math.max(0, lastFilled)]?.focus()
	}

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault()
		if (code.length !== 6) {
			toast({
				title: t('twofa.toast.codeIncompleteTitle'),
				description: t('twofa.toast.codeIncompleteDesc'),
				variant: 'destructive',
			})
			return
		}
		try {
			const user = await verify2fa({ twoFaToken, code }).unwrap()
			dispatch(setUser(user))
			sessionStorage.removeItem('twoFaToken')
			sessionStorage.removeItem('twoFaMaskedEmail')
			sessionStorage.removeItem('twoFaTTL')
			sessionStorage.removeItem('twoFaCooldown')
			router.replace(`/${lang}`)
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('twofa.toast.verifyFailDefault')
			toast({ title: t('twofa.toast.error'), description: msg, variant: 'destructive' })
		}
	}

	const handleResend = async () => {
		try {
			await resend2fa({ twoFaToken }).unwrap()
			const cd = Number(sessionStorage.getItem('twoFaCooldown') || 60)
			setCooldown(Number.isFinite(cd) ? cd : 60)
			toast({
				title: t('twofa.toast.resendOkTitle'),
				description: t('twofa.toast.resendOkDesc'),
			})
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('twofa.toast.resendFailDesc')
			toast({ title: t('twofa.toast.error'), description: msg, variant: 'destructive' })
		}
	}

	const minutes = Math.max(1, Math.round(ttlSec / 60))

	return (
		<>
			<AuthBrand />

			<AuthCard title={t('twofa.title')} subtitle={t('twofa.subtitle')}>
				<form onSubmit={handleVerify} className='space-y-6' onPaste={onPaste}>
					{/* Hint */}
					<div className='rounded-lg bg-blue-50/70 border border-blue-100 px-4 py-3 text-sm text-slate-700 flex items-start gap-3'>
						<Mail className='h-4 w-4 text-blue-600 mt-0.5' />
						<div className='leading-relaxed'>
							{t('twofa.codeSent')}
							{maskedEmail ? (
								<>
									{' '}
									{t('twofa.to')}{' '}
									<span className='font-semibold'>{maskedEmail}</span>
								</>
							) : (
								''
							)}
							.<br />
							<span className='inline-flex items-center gap-1 text-slate-500'>
								<Clock className='h-3.5 w-3.5' />
								{t('twofa.validForApprox')} {minutes} {t('twofa.min')}
							</span>
						</div>
					</div>

					{/* OTP inputs */}
					<div className='space-y-2'>
						<Label className='text-sm font-semibold text-slate-700'>
							{t('twofa.label6')}
						</Label>
						<div className='grid grid-cols-6 gap-2'>
							{otp.map((val, idx) => (
								<Input
									key={idx}
									ref={(el) => (inputsRef.current[idx] = el)}
									inputMode='numeric'
									pattern='[0-9]*'
									maxLength={1}
									value={val}
									onChange={(e) => onChangeCell(idx, e.target.value)}
									onKeyDown={(e) => onKeyDownCell(idx, e)}
									className='h-12 text-center text-xl tracking-widest bg-white/70 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
									autoFocus={idx === 0}
								/>
							))}
						</div>
						<p className='text-xs text-slate-500 mt-1'>{t('twofa.pasteHint')}</p>
					</div>

					{/* Submit */}
					<Button
						type='submit'
						disabled={isVerifying || code.length !== 6}
						className='w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
					>
						{isVerifying ? (
							<div className='flex items-center gap-2'>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
								{t('twofa.verifying')}
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<ShieldCheck className='h-4 w-4' />
								{t('twofa.confirmAndSignIn')}
							</div>
						)}
					</Button>

					{/* Resend + Back */}
					<div className='flex items-center justify-between'>
						<Button
							type='button'
							variant='outline'
							onClick={handleResend}
							disabled={isResending || cooldown > 0}
							className='h-10'
						>
							<div className='flex items-center gap-2'>
								<RefreshCw className='h-4 w-4' />
								{cooldown > 0
									? `${t('twofa.resendCooldown')} (${cooldown}s)`
									: t('twofa.resend')}
							</div>
						</Button>

						<Button
							type='button'
							variant='ghost'
							onClick={() => router.replace(`/${lang}/login`)}
							className='h-10 text-slate-600 hover:text-slate-800'
						>
							<ChevronLeft className='h-4 w-4 mr-1' />
							{t('twofa.changeAccount')}
						</Button>
					</div>
				</form>
			</AuthCard>
		</>
	)
}
