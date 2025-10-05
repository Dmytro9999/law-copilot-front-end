'use client'

import * as React from 'react'
import { Mail, Phone, Shield, ShieldOff, CalendarDays, User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import Badge from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useI18n, useLocale } from '@/providers/I18nProvider'
import { useAppSelector } from '@/store/hooks'
import authSelectors from '@/store/features/auth/authSelectors'

type Role = { id?: number | string; name: string }
type UserPreview = {
	id: number | string
	name: string
	email: string
	phone?: string | null
	avatar?: string | null
	two_factor_enabled: boolean
	created?: string | null
	updated?: string | null
	roles?: Role[]
}

export default function UserPreviewCard() {
	const { t } = useI18n()
	const locale = useLocale?.() ?? 'he'

	const user = useAppSelector(authSelectors.selectUser)

	if (!user) return null

	const fmt = new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
	})

	const initials =
		(user.name || '')
			.split(' ')
			.map((p: any) => p[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'U'

	return (
		<Card className={cn('shadow-sm')}>
			<CardHeader className='flex flex-row items-center justify-between space-y-0'>
				<CardTitle className='text-lg'>{t('profile.card.title') || 'Account'}</CardTitle>

				<div
					className={cn(
						'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs',
						user.two_factor_enabled
							? 'border-green-200 bg-green-50 text-green-700'
							: 'border-slate-200 bg-slate-50 text-slate-600'
					)}
					title={
						user.two_factor_enabled
							? t('profile.twofa.enabled') || '2FA enabled'
							: t('profile.twofa.disabled') || '2FA disabled'
					}
				>
					{user.two_factor_enabled ? (
						<Shield className='h-3.5 w-3.5' />
					) : (
						<ShieldOff className='h-3.5 w-3.5' />
					)}
					<span>
						{user.two_factor_enabled
							? t('profile.twofa.enabled') || '2FA enabled'
							: t('profile.twofa.disabled') || '2FA disabled'}
					</span>
				</div>
			</CardHeader>

			<CardContent className='space-y-5'>
				{/* Header line */}
				<div className='flex items-center gap-4'>
					<Avatar className='h-16 w-16 ring-2 ring-white shadow'>
						{user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
						<AvatarFallback className='bg-slate-100 text-slate-700'>
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className='min-w-0'>
						<div className='flex items-center gap-2 text-slate-900 font-semibold'>
							<UserIcon className='h-4 w-4 text-slate-500' />
							<span className='truncate'>{user.name}</span>
						</div>
						<div className='mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600'>
							<span className='inline-flex items-center gap-1'>
								<Mail className='h-4 w-4 text-slate-400' />
								<span className='truncate'>{user.email}</span>
							</span>
						</div>

						{user.phone ? (
							<span className='mt-1 inline-flex items-center gap-1'>
								<Phone className='h-4 w-4 text-slate-400' />
								<span className='truncate'>{user.phone}</span>
							</span>
						) : null}
					</div>
				</div>

				<Separator />

				{/* Grid fields */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<Field label={t('profile.fields.name') || 'Full name'} value={user.name} />
					<Field label={t('profile.fields.email') || 'Email'} value={user.email} />
					<Field
						label={t('profile.fields.phone') || 'Phone'}
						value={user.phone || t('profile.empty.phone') || 'Not provided'}
					/>
					<div className='space-y-1.5'>
						<div className='text-xs font-medium text-slate-500'>
							{t('profile.fields.roles') || 'Roles'}
						</div>
						<div className='flex flex-wrap gap-1.5'>
							{user.roles && user.roles.length > 0 ? (
								user.roles.map((r: any, i: any) => (
									<Badge
										key={r.id ?? i}
										className='bg-slate-100 text-slate-700 border-slate-200'
									>
										{r.name}
									</Badge>
								))
							) : (
								<span className='text-sm text-slate-600'>
									{t('profile.roles.empty') || 'No roles'}
								</span>
							)}
						</div>
					</div>
					{user.created ? (
						<Field
							label={t('profile.fields.created') || 'Joined'}
							value={
								<span className='inline-flex items-center gap-1'>
									<CalendarDays className='h-4 w-4 text-slate-400' />
									{fmt.format(new Date(user.created))}
								</span>
							}
						/>
					) : null}
					{user.updated ? (
						<Field
							label={t('profile.fields.updated') || 'Last updated'}
							value={fmt.format(new Date(user.updated))}
						/>
					) : null}
				</div>
			</CardContent>

			{/*<CardFooter className='text-xs text-slate-500'>ID: {String(user.id)}</CardFooter>*/}
		</Card>
	)
}

function Field({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
	return (
		<div className='space-y-1.5 min-w-0'>
			<div className='text-xs font-medium text-slate-500'>{label}</div>
			<div className='text-sm text-slate-800 break-words'>{value}</div>
		</div>
	)
}
