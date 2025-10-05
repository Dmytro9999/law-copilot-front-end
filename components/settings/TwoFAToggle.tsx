'use client'

import * as React from 'react'
import { useAppSelector } from '@/store/hooks'
import authSelectors from '@/store/features/auth/authSelectors'
import { useToast } from '@/components/ui/use-toast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Shield, ShieldOff, Loader2 } from 'lucide-react'
import { useDisable2faMutation, useEnable2faMutation } from '@/store/features/auth/authApi'
import { useI18n } from '@/providers/I18nProvider'

export default function TwoFAToggle() {
	const { t } = useI18n()
	const { toast } = useToast()
	const user = useAppSelector(authSelectors.selectUser)
	const enabled = Boolean(user?.two_factor_enabled)

	const [enable2fa, { isLoading: enabling }] = useEnable2faMutation()
	const [disable2fa, { isLoading: disabling }] = useDisable2faMutation()

	const [confirmOpen, setConfirmOpen] = React.useState(false)
	const [password, setPassword] = React.useState('')
	const [submitting, setSubmitting] = React.useState(false)

	const onToggle = async (next: boolean) => {
		if (next) {
			try {
				await enable2fa().unwrap()
				toast({
					title: t('settings.security.twofa.enabledTitle') || '2FA enabled',
					description:
						t('settings.security.twofa.enabledDesc') ||
						'Two-factor authentication has been activated.',
					className: 'bg-green-600 text-white',
				})
			} catch (e: any) {
				toast({
					title: t('settings.security.twofa.error') || 'Error',
					description:
						e?.data?.message ||
						e?.message ||
						t('settings.security.twofa.enableError') ||
						'Failed to enable 2FA',
					variant: 'destructive',
				})
			}
			return
		}

		setPassword('')
		setConfirmOpen(true)
	}

	const confirmDisable = async () => {
		setSubmitting(true)
		try {
			await disable2fa({ password }).unwrap()
			setConfirmOpen(false)
			toast({
				title: t('settings.security.twofa.disabledTitle') || '2FA disabled',
				description:
					t('settings.security.twofa.disabledDesc') ||
					'Two-factor authentication has been turned off.',
				className: 'bg-amber-600 text-white',
			})
		} catch (e: any) {
			toast({
				title: t('settings.security.twofa.error') || 'Error',
				description:
					e?.data?.message ||
					e?.message ||
					t('settings.security.twofa.disableError') ||
					'Failed to disable 2FA',
				variant: 'destructive',
			})
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className='rounded-lg border p-4 bg-white'>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex items-center gap-3'>
					{enabled ? (
						<Shield className='h-5 w-5 text-green-600' />
					) : (
						<ShieldOff className='h-5 w-5 text-slate-500' />
					)}
					<div>
						<div className='font-medium text-slate-800'>
							{t('settings.security.twofa.title') ||
								'Two-factor authentication (2FA)'}
						</div>
						<div className='text-sm text-slate-500'>
							{enabled
								? t('settings.security.twofa.statusEnabled') ||
									'Enabled for your account'
								: t('settings.security.twofa.statusDisabled') ||
									'Improve security by turning on 2FA'}
						</div>
					</div>
				</div>

				<div className='flex items-center gap-3'>
					<Label htmlFor='switch-2fa' className='text-sm'>
						{enabled
							? t('settings.security.twofa.on') || 'On'
							: t('settings.security.twofa.off') || 'Off'}
					</Label>
					<Switch
						id='switch-2fa'
						checked={enabled}
						disabled={enabling || disabling}
						onCheckedChange={onToggle}
					/>
				</div>
			</div>

			{/* Диалог подтверждения выключения */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>
							{t('settings.security.twofa.confirmDisableTitle') || 'Disable 2FA'}
						</DialogTitle>
					</DialogHeader>
					<div className='space-y-3'>
						<p className='text-sm text-slate-600'>
							{t('settings.security.twofa.confirmDisableDesc') ||
								'To turn off 2FA, enter your account password.'}
						</p>
						<div className='space-y-2'>
							<Label htmlFor='disable-2fa-password'>
								{t('settings.security.twofa.passwordLabel') || 'Password'}
							</Label>
							<Input
								id='disable-2fa-password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={
									t('settings.security.twofa.passwordPh') || 'Enter your password'
								}
							/>
						</div>
					</div>
					<DialogFooter className='gap-2'>
						<Button variant='outline' onClick={() => setConfirmOpen(false)}>
							{t('settings.security.twofa.cancel') || 'Cancel'}
						</Button>
						<Button onClick={confirmDisable} disabled={!password || submitting}>
							{submitting ? (
								<>
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
									{t('settings.security.twofa.disabling') || 'Disabling…'}
								</>
							) : (
								t('settings.security.twofa.disableCta') || 'Disable 2FA'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
