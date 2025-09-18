// src/components/Modals/AddClientModal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { UserPlus, Loader2, Building, User } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/providers/I18nProvider'
import { useCreateInvitationMutation } from '@/store/features/invitations/invitationsApi'
import { CreateInvitationRequest } from '@/store/features/invitations/invitationsTypes'

interface AddClientModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
	const { toast } = useToast()
	const { t } = useI18n()

	const [createInvitation, { isLoading }] = useCreateInvitationMutation()

	const [formData, setFormData] = useState({
		clientType: 'individual' as 'individual' | 'company',
		fullName: '',
		email: '',
		phone: '',
		companyName: '',
		position: '',
		address: '',
		identificationCode: '',
		businessNumber: '',
		notes: '',
	})

	const canSubmit =
		formData.email.trim() !== '' &&
		(formData.clientType === 'company'
			? formData.companyName.trim() !== ''
			: formData.fullName.trim() !== '')

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit) return

		const payload: CreateInvitationRequest = {
			email: formData.email.trim().toLowerCase(),
			clientType: formData.clientType,
			fullName: formData.clientType === 'individual' ? formData.fullName.trim() : null,
			phone: formData.phone.trim() || null,
			companyName: formData.clientType === 'company' ? formData.companyName.trim() : null,
			position: formData.clientType === 'company' ? formData.position.trim() || null : null,
			address: formData.address.trim() || null,
			identificationCode:
				formData.clientType === 'individual'
					? formData.identificationCode.trim() || null
					: null,
			businessNumber:
				formData.clientType === 'company' ? formData.businessNumber.trim() || null : null,
			notes: formData.notes.trim() || null,
			// expiresInHours: 168, // если хочешь переопределять TTL
		}

		try {
			await createInvitation(payload).unwrap()

			toast({
				title: t('inviteModal.toast.successTitle'),
				description: t('inviteModal.toast.successDesc'),
				className: 'bg-gradient-to-l from-green-600 to-emerald-600 text-white border-none',
			})

			setFormData({
				clientType: 'individual',
				fullName: '',
				email: '',
				phone: '',
				companyName: '',
				position: '',
				address: '',
				identificationCode: '',
				businessNumber: '',
				notes: '',
			})

			onClose()
		} catch (err: any) {
			const msg = err?.data?.message || err?.message || t('inviteModal.toast.defaultError')
			toast({
				title: t('inviteModal.toast.errorTitle'),
				description: msg,
				variant: 'destructive',
			})
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-3'>
						<UserPlus className='h-6 w-6 text-green-600' />
						{t('inviteModal.title')}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-6 mt-4'>
					<div className='space-y-2'>
						<Label className='text-lg font-medium'>
							{t('inviteModal.clientTypeLabel')}
						</Label>
						<Select
							value={formData.clientType}
							onValueChange={(value: 'individual' | 'company') =>
								setFormData((p) => ({ ...p, clientType: value }))
							}
						>
							<SelectTrigger className='h-12 text-lg'>
								<SelectValue placeholder={t('inviteModal.clientTypePlaceholder')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='individual'>
									<div className='flex items-center gap-2'>
										<User className='h-4 w-4' />
										{t('inviteModal.clientTypeIndividual')}
									</div>
								</SelectItem>
								<SelectItem value='company'>
									<div className='flex items-center gap-2'>
										<Building className='h-4 w-4' />
										{t('inviteModal.clientTypeCompany')}
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Имя / Компания + Email */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-2'>
							<Label htmlFor='name' className='text-lg font-medium'>
								{formData.clientType === 'company'
									? t('inviteModal.companyNameLabel')
									: t('inviteModal.fullNameLabel')}{' '}
								*
							</Label>
							<Input
								id='name'
								className='h-12 text-lg'
								value={
									formData.clientType === 'company'
										? formData.companyName
										: formData.fullName
								}
								onChange={(e) =>
									setFormData((p) =>
										p.clientType === 'company'
											? { ...p, companyName: e.target.value }
											: { ...p, fullName: e.target.value }
									)
								}
								placeholder={
									formData.clientType === 'company'
										? t('inviteModal.companyNamePh')
										: t('inviteModal.fullNamePh')
								}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='email' className='text-lg font-medium'>
								{t('inviteModal.emailLabel')} *
							</Label>
							<Input
								id='email'
								type='email'
								className='h-12 text-lg'
								value={formData.email}
								onChange={(e) =>
									setFormData((p) => ({ ...p, email: e.target.value }))
								}
								placeholder='client@example.com'
								required
							/>
						</div>
					</div>

					{/* Телефон / Должность (для company) */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-2'>
							<Label htmlFor='phone' className='text-lg font-medium'>
								{t('inviteModal.phoneLabel')}
							</Label>
							<Input
								id='phone'
								className='h-12 text-lg'
								value={formData.phone}
								onChange={(e) =>
									setFormData((p) => ({ ...p, phone: e.target.value }))
								}
								placeholder={t('inviteModal.phonePh')}
							/>
						</div>

						{formData.clientType === 'company' && (
							<div className='space-y-2'>
								<Label htmlFor='position' className='text-lg font-medium'>
									{t('inviteModal.positionLabel')}
								</Label>
								<Input
									id='position'
									className='h-12 text-lg'
									value={formData.position}
									onChange={(e) =>
										setFormData((p) => ({ ...p, position: e.target.value }))
									}
									placeholder={t('inviteModal.positionPh')}
								/>
							</div>
						)}
					</div>

					{/* Адрес */}
					<div className='space-y-2'>
						<Label htmlFor='address' className='text-lg font-medium'>
							{t('inviteModal.addressLabel')}
						</Label>
						<Input
							id='address'
							className='h-12 text-lg'
							value={formData.address}
							onChange={(e) =>
								setFormData((p) => ({ ...p, address: e.target.value }))
							}
							placeholder={t('inviteModal.addressPh')}
						/>
					</div>

					{/* ID / Business number по типу */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{formData.clientType === 'individual' ? (
							<div className='space-y-2'>
								<Label htmlFor='identificationCode' className='text-lg font-medium'>
									{t('inviteModal.identificationCodeLabel')}
								</Label>
								<Input
									id='identificationCode'
									className='h-12 text-lg'
									value={formData.identificationCode}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											identificationCode: e.target.value,
										}))
									}
									placeholder={t('inviteModal.identificationCodePh')}
								/>
							</div>
						) : (
							<div className='space-y-2'>
								<Label htmlFor='businessNumber' className='text-lg font-medium'>
									{t('inviteModal.businessNumberLabel')}
								</Label>
								<Input
									id='businessNumber'
									className='h-12 text-lg'
									value={formData.businessNumber}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											businessNumber: e.target.value,
										}))
									}
									placeholder={t('inviteModal.businessNumberPh')}
								/>
							</div>
						)}

						<div className='space-y-2'>
							<Label htmlFor='notes' className='text-lg font-medium'>
								{t('inviteModal.notesLabel')}
							</Label>
							<Textarea
								id='notes'
								className='min-h-[100px] text-lg'
								value={formData.notes}
								onChange={(e) =>
									setFormData((p) => ({ ...p, notes: e.target.value }))
								}
								placeholder={t('inviteModal.notesPh')}
							/>
						</div>
					</div>

					{/* Кнопки */}
					<div className='flex gap-4 pt-6'>
						<Button
							type='submit'
							disabled={isLoading || !canSubmit}
							className='flex-1 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-14 text-lg'
						>
							{isLoading ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									{t('inviteModal.saving')}
								</>
							) : (
								<>
									<UserPlus className='ml-2 h-5 w-5' />
									{t('inviteModal.submit')}
								</>
							)}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={isLoading}
							className='px-8 h-14 text-lg bg-transparent'
						>
							{t('inviteModal.cancel')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
