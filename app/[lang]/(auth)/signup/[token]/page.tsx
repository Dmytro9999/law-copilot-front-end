'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
	Mail,
	User,
	Building,
	Phone,
	Shield,
	FileText,
	Landmark,
	Info,
	Loader2,
} from 'lucide-react'

import AuthBrand from '@/components/auth/AuthBrand'
import AuthCard from '@/components/auth/AuthCard'
import PasswordField from '@/components/auth/PasswordField'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'

import { useI18n, useLocale } from '@/providers/I18nProvider'
import {
	useVerifyInvitationQuery,
	useAcceptInvitationMutation,
} from '@/store/features/invitations/invitationsApi'

type ClientType = 'individual' | 'company'

export default function SignUpByTokenPage() {
	const { toast } = useToast()
	const router = useRouter()
	const { token } = useParams<{ token: string }>()
	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'

	// 1) Загружаем инвайт по токену
	const { data, isFetching } = useVerifyInvitationQuery(token, { skip: !token })

	// 2) Локальное состояние формы — имена 1-в-1 с Invitation
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [fullName, setFullName] = useState('')
	const [phone, setPhone] = useState('')
	const [clientType, setClientType] = useState<ClientType>('individual')
	const [companyName, setCompanyName] = useState('')
	const [position, setPosition] = useState('')
	const [address, setAddress] = useState('')
	const [identificationCode, setIdentificationCode] = useState('')
	const [businessNumber, setBusinessNumber] = useState('')
	const [notes, setNotes] = useState('')

	const invitedByName = useMemo(() => data?.invitedByName ?? '', [data])

	useEffect(() => {
		if (!data) return
		setEmail((data.email || '').toLowerCase())
		setFullName(data.fullName || data.email || '')
		setPhone(data.phone || '')
		setClientType((data.clientType as ClientType) || 'individual')
		setCompanyName(data.companyName || '')
		setPosition(data.position || '')
		setAddress(data.address || '')
		setIdentificationCode(data.identificationCode || '')
		setBusinessNumber(data.businessNumber || '')
		setNotes(data.notes || '')
	}, [data])

	// 3) Сабмит
	const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation()

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!token) return

		if (!password.trim()) {
			toast({
				title: t('signupInvite.toast.missingPasswordTitle'),
				description: t('signupInvite.toast.missingPasswordDesc'),
				variant: 'destructive',
			})
			return
		}

		try {
			await acceptInvitation({
				token,
				password: password.trim(),
				profileOverride: {
					fullName: fullName.trim(),
					phone: phone.trim() || null,
					clientType,
					companyName: clientType === 'company' ? companyName.trim() || null : null,
					position: clientType === 'company' ? position.trim() || null : null,
					businessNumber: clientType === 'company' ? businessNumber.trim() || null : null,
					identificationCode:
						clientType === 'individual' ? identificationCode.trim() || null : null,
					address: address.trim() || null,
					notes: notes.trim() || null,
				},
			}).unwrap()

			toast({
				title: t('signupInvite.toast.successTitle'),
				description: t('signupInvite.toast.successDesc'),
				className: 'bg-gradient-to-l from-green-600 to-emerald-600 text-white border-none',
			})

			router.replace(`/${lang}/login`)
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('signupInvite.toast.defaultError')
			toast({
				title: t('signupInvite.toast.errorTitle'),
				description: msg,
				variant: 'destructive',
			})
		}
	}

	// 4) Лоадер
	if (isFetching) {
		return (
			<>
				<AuthBrand />
				<AuthCard title={t('signupInvite.title')} subtitle={t('signupInvite.subtitle')}>
					<div className='flex items-center gap-3 text-slate-600'>
						<Loader2 className='h-4 w-4 animate-spin' />
						{t('signupInvite.loading')}
					</div>
				</AuthCard>
			</>
		)
	}

	// if (isError || !data) {
	// 	return (
	// 		<>
	// 			<AuthBrand />
	// 			<AuthCard title={t('signupInvite.title')} subtitle={t('signupInvite.subtitle')}>
	// 				<Alert variant='destructive' className='mb-6'>
	// 					<AlertDescription>{t('signupInvite.invalidOrExpired')}</AlertDescription>
	// 				</Alert>
	// 				<div className='text-sm'>
	// 					<Link href={`/${lang}/login`} className='text-blue-600 hover:text-blue-700'>
	// 						{t('signupInvite.goLogin')}
	// 					</Link>
	// 				</div>
	// 			</AuthCard>
	// 		</>
	// 	)
	// }

	// 5) Форма
	return (
		<>
			<AuthBrand />

			<AuthCard title={t('signupInvite.title')} subtitle={t('signupInvite.subtitle')}>
				{/* Инфо-блок */}
				<Alert className='mb-6 bg-blue-50 border-blue-200'>
					<AlertDescription className='text-blue-800'>
						<div className='font-semibold'>
							{/*{t('signupInvite.welcome', { name: fullName || email })}*/}
						</div>
						<div className='text-sm mt-1'>
							{/*{invitedByName*/}
							{/*	? t('signupInvite.invitedBy', { lawyer: invitedByName })*/}
							{/*	: t('signupInvite.invitedByUnknown')}*/}
						</div>
						<div className='text-sm mt-1'>{t('signupInvite.checkAndSetPassword')}</div>
					</AlertDescription>
				</Alert>

				<form onSubmit={onSubmit} className='space-y-4'>
					{/* Full name */}
					<div className='space-y-2'>
						<Label htmlFor='fullName' className='text-sm font-semibold text-slate-700'>
							{t('signupInvite.fields.fullName')}
						</Label>
						<div className='relative'>
							<User className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='fullName'
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								placeholder={t('signupInvite.placeholders.fullName')}
								className='h-12 pr-10'
								required
							/>
						</div>
					</div>

					{/* Email (readonly) */}
					<div className='space-y-2'>
						<Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
							{t('signupInvite.fields.email')}
						</Label>
						<div className='relative'>
							<Mail className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
							<Input
								id='email'
								type='email'
								value={email}
								disabled
								className='h-12 pr-10 bg-slate-50'
							/>
						</div>
						<p className='text-xs text-slate-500 flex items-center gap-1'>
							<Info className='h-3.5 w-3.5' />
							{t('signupInvite.emailLockedHint')}
						</p>
					</div>

					{/* Phone / ClientType */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='phone' className='text-sm font-semibold text-slate-700'>
								{t('signupInvite.fields.phone')}
							</Label>
							<div className='relative'>
								<Phone className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
								<Input
									id='phone'
									type='tel'
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder={t('signupInvite.placeholders.phone')}
									className='h-12 pr-10'
								/>
							</div>
						</div>

						<div>
							<Label className='text-sm font-semibold text-slate-700'>
								{t('signupInvite.fields.clientType')}
							</Label>
							<Select
								value={clientType}
								onValueChange={(v: ClientType) => setClientType(v)}
							>
								<SelectTrigger className='mt-2 h-12'>
									<SelectValue
										placeholder={t('signupInvite.placeholders.clientType')}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='individual'>
										{t('signupInvite.clientTypes.individual')}
									</SelectItem>
									<SelectItem value='company'>
										{t('signupInvite.clientTypes.company')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Company-only: companyName / position */}
					{clientType === 'company' && (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='companyName'
									className='text-sm font-semibold text-slate-700'
								>
									{t('signupInvite.fields.companyName')}
								</Label>
								<div className='relative'>
									<Building className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
									<Input
										id='companyName'
										value={companyName}
										onChange={(e) => setCompanyName(e.target.value)}
										placeholder={t('signupInvite.placeholders.companyName')}
										className='h-12 pr-10'
									/>
								</div>
							</div>

							<div>
								<Label
									htmlFor='position'
									className='text-sm font-semibold text-slate-700'
								>
									{t('signupInvite.fields.position')}
								</Label>
								<div className='relative'>
									<FileText className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
									<Input
										id='position'
										value={position}
										onChange={(e) => setPosition(e.target.value)}
										placeholder={t('signupInvite.placeholders.position')}
										className='h-12 pr-10'
									/>
								</div>
							</div>
						</div>
					)}

					{/* Address */}
					<div>
						<Label htmlFor='address' className='text-sm font-semibold text-slate-700'>
							{t('signupInvite.fields.address')}
						</Label>
						<Textarea
							id='address'
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder={t('signupInvite.placeholders.address')}
							rows={2}
						/>
					</div>

					{/* Switch-field row: identificationCode vs businessNumber */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						{clientType === 'individual' ? (
							<div>
								<Label
									htmlFor='identificationCode'
									className='text-sm font-semibold text-slate-700'
								>
									{t('signupInvite.fields.identificationCode')}
								</Label>
								<div className='relative'>
									<IdCard className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
									<Input
										id='identificationCode'
										value={identificationCode}
										onChange={(e) => setIdentificationCode(e.target.value)}
										placeholder={t(
											'signupInvite.placeholders.identificationCode'
										)}
										className='h-12 pr-10'
									/>
								</div>
							</div>
						) : (
							<div>
								<Label
									htmlFor='businessNumber'
									className='text-sm font-semibold text-slate-700'
								>
									{t('signupInvite.fields.businessNumber')}
								</Label>
								<div className='relative'>
									<Landmark className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
									<Input
										id='businessNumber'
										value={businessNumber}
										onChange={(e) => setBusinessNumber(e.target.value)}
										placeholder={t('signupInvite.placeholders.businessNumber')}
										className='h-12 pr-10'
									/>
								</div>
							</div>
						)}

						<div>
							<Label htmlFor='notes' className='text-sm font-semibold text-slate-700'>
								{t('signupInvite.fields.notes')}
							</Label>
							<Textarea
								id='notes'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t('signupInvite.placeholders.notes')}
								rows={clientType === 'individual' ? 1 : 1}
							/>
						</div>
					</div>

					{/* Password */}
					<PasswordField
						value={password}
						onChange={setPassword}
						helper={t('signupInvite.passwordHelper')}
					/>

					{/* Submit */}
					<Button
						type='submit'
						disabled={isAccepting}
						className='w-full h-12 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
					>
						{isAccepting ? (
							<div className='flex items-center gap-2'>
								<Loader2 className='h-4 w-4 animate-spin' />
								{t('signupInvite.submitting')}
							</div>
						) : (
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4' />
								{t('signupInvite.submit')}
							</div>
						)}
					</Button>

					<div className='mt-2 text-center'>
						<Link className='text-blue-600 hover:text-blue-700' href={`/${lang}/login`}>
							{t('signupInvite.footerLogin')}
						</Link>
					</div>
				</form>
			</AuthCard>
		</>
	)
}

// Временная «ID-card»-иконка
function IdCard(props: any) {
	return <FileText {...props} />
}
