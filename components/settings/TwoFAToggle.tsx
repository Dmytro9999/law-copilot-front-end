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

export default function TwoFAToggle() {
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
					title: '2FA включена',
					description: 'Двухфакторная аутентификация успешно активирована.',
					className: 'bg-green-600 text-white',
				})
			} catch (e: any) {
				toast({
					title: 'Ошибка',
					description: e?.data?.message || e?.message || 'Не удалось включить 2FA',
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
				title: '2FA выключена',
				description: 'Двухфакторная аутентификация успешно отключена.',
				className: 'bg-amber-600 text-white',
			})
		} catch (e: any) {
			toast({
				title: 'Ошибка',
				description: e?.data?.message || e?.message || 'Не удалось отключить 2FA',
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
							Двухфакторная аутентификация (2FA)
						</div>
						<div className='text-sm text-slate-500'>
							{enabled
								? 'Включена для вашей учётной записи'
								: 'Вы можете усилить безопасность, включив 2FA'}
						</div>
					</div>
				</div>

				<div className='flex items-center gap-3'>
					<Label htmlFor='switch-2fa' className='text-sm'>
						{enabled ? 'Вкл' : 'Выкл'}
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
						<DialogTitle>Отключить 2FA</DialogTitle>
					</DialogHeader>
					<div className='space-y-3'>
						<p className='text-sm text-slate-600'>
							Для отключения 2FA введите пароль от вашей учётной записи.
						</p>
						<div className='space-y-2'>
							<Label htmlFor='disable-2fa-password'>Пароль</Label>
							<Input
								id='disable-2fa-password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder='Введите пароль'
							/>
						</div>
					</div>
					<DialogFooter className='gap-2'>
						<Button variant='outline' onClick={() => setConfirmOpen(false)}>
							Отмена
						</Button>
						<Button onClick={confirmDisable} disabled={!password || submitting}>
							{submitting ? (
								<>
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
									Отключаю…
								</>
							) : (
								'Отключить 2FA'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
