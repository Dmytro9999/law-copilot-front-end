'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Save } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type Locale = 'he' | 'en'

interface ManualObligationModalProps {
	isOpen: boolean
	onClose: () => void
	onAdd: (obligation: {
		_key: string
		id?: string
		description: string
		responsibleParty: string
		dueDate: string | null
		priority: string | null
		category: string | null
		requiresProof: boolean
		amount: number | null
		aiGenerated: boolean
	}) => void
	locale?: Locale
}

export default function ManualObligationModal({
	isOpen,
	onClose,
	onAdd,
	locale = 'he',
}: ManualObligationModalProps) {
	const [formData, setFormData] = useState({
		description: '',
		responsibleParty: '',
		dueDate: '',
		priority: 'בינונית',
		category: '',
		requiresProof: false,
		amount: '',
	})
	const [isLoading, setIsLoading] = useState(false)
	const { toast } = useToast()

	const i18n = useMemo<Record<Locale, Record<string, string>>>(
		() => ({
			he: {
				title: 'הוספת התחייבות ידנית',
				formErrorTitle: 'שגיאה בטופס',
				formErrorDesc: 'נא למלא תיאור וצד אחראי',
				addedOkTitle: 'התחייבות נוספה! ✅',
				addedOkDesc: 'ההתחייבות נוספה לרשימה, תישמר עם החוזה',
				genericErrorTitle: 'שגיאה',
				genericErrorDesc: 'אירעה שגיאה בהוספת ההתחייבות',
				descriptionLabel: 'תיאור ההתחייבות *',
				descriptionPh: 'הזן תיאור מפורט של ההתחייבות...',
				responsibleLabel: 'צד אחראי *',
				responsiblePh: 'מי אחראי לביצוע?',
				dueDateLabel: 'תאריך יעד',
				priorityLabel: 'עדיפות',
				categoryLabel: 'קטגוריה',
				categoryPh: 'למשל: תשלום, דיווח, אספקה',
				amountLabel: 'סכום (אופציונלי)',
				amountPh: 'למשל: 10,000',
				requiresProof: 'דורש הוכחת ביצוע',
				cancel: 'ביטול',
				saving: 'שומר...',
				save: 'שמור התחייבות',
				prioHigh: 'גבוהה',
				prioMed: 'בינונית',
				prioLow: 'נמוכה',
			},
			en: {
				title: 'Add manual obligation',
				formErrorTitle: 'Form error',
				formErrorDesc: 'Please fill description and responsible party',
				addedOkTitle: 'Obligation added! ✅',
				addedOkDesc:
					'The obligation was added to the list and will be saved with the contract',
				genericErrorTitle: 'Error',
				genericErrorDesc: 'Failed to add obligation',
				descriptionLabel: 'Obligation description *',
				descriptionPh: 'Enter a detailed description...',
				responsibleLabel: 'Responsible party *',
				responsiblePh: 'Who is responsible?',
				dueDateLabel: 'Due date',
				priorityLabel: 'Priority',
				categoryLabel: 'Category',
				categoryPh: 'e.g. Payment, Report, Delivery',
				amountLabel: 'Amount (optional)',
				amountPh: 'e.g. 10,000',
				requiresProof: 'Proof required',
				cancel: 'Cancel',
				saving: 'Saving...',
				save: 'Save obligation',
				prioHigh: 'High',
				prioMed: 'Medium',
				prioLow: 'Low',
			},
		}),
		[]
	)

	const t = (k: string) => i18n[locale][k] || k

	const handleInputChange = (field: keyof typeof formData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const makeKey = () =>
		globalThis.crypto?.randomUUID?.() ??
		`tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.description || !formData.responsibleParty) {
			toast({
				title: t('formErrorTitle'),
				description: t('formErrorDesc'),
				variant: 'destructive',
			})
			return
		}

		setIsLoading(true)
		try {
			const amountNum =
				formData.amount === ''
					? null
					: Number(String(formData.amount).replace(/[^\d.-]/g, ''))

			onAdd({
				_key: makeKey(),
				description: formData.description,
				responsibleParty: formData.responsibleParty,
				dueDate: formData.dueDate || null,
				priority: formData.priority || null,
				category: formData.category || null,
				requiresProof: !!formData.requiresProof,
				amount: Number.isFinite(amountNum as number) ? (amountNum as number) : null,
				aiGenerated: false,
			})

			toast({
				title: t('addedOkTitle'),
				description: t('addedOkDesc'),
				className: 'bg-green-500 text-white',
			})

			setFormData({
				description: '',
				responsibleParty: '',
				dueDate: '',
				priority: 'בינונית',
				category: '',
				requiresProof: false,
				amount: '',
			})
			onClose()
		} catch (err) {
			console.error(err)
			toast({
				title: t('genericErrorTitle'),
				description: t('genericErrorDesc'),
				variant: 'destructive',
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
						<Plus className='h-6 w-6 text-green-600' />
						{t('title')}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<div>
						<Label htmlFor='description' className='text-base font-medium'>
							{t('descriptionLabel')}
						</Label>
						<Textarea
							id='description'
							placeholder={t('descriptionPh')}
							value={formData.description}
							onChange={(e) => handleInputChange('description', e.target.value)}
							rows={3}
							className='mt-2'
							required
						/>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='responsible_party' className='text-base font-medium'>
								{t('responsibleLabel')}
							</Label>
							<Input
								id='responsible_party'
								placeholder={t('responsiblePh')}
								value={formData.responsibleParty}
								onChange={(e) =>
									handleInputChange('responsibleParty', e.target.value)
								}
								className='mt-2'
								required
							/>
						</div>

						<div>
							<Label htmlFor='due_date' className='text-base font-medium'>
								{t('dueDateLabel')}
							</Label>
							<Input
								id='due_date'
								type='date'
								value={formData.dueDate}
								onChange={(e) => handleInputChange('dueDate', e.target.value)}
								className='mt-2'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='priority' className='text-base font-medium'>
								{t('priorityLabel')}
							</Label>
							<Select
								value={formData.priority}
								onValueChange={(value) => handleInputChange('priority', value)}
							>
								<SelectTrigger className='mt-2'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='גבוהה'>{t('prioHigh')}</SelectItem>
									<SelectItem value='בינונית'>{t('prioMed')}</SelectItem>
									<SelectItem value='נמוכה'>{t('prioLow')}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='category' className='text-base font-medium'>
								{t('categoryLabel')}
							</Label>
							<Input
								id='category'
								placeholder={t('categoryPh')}
								value={formData.category}
								onChange={(e) => handleInputChange('category', e.target.value)}
								className='mt-2'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='amount' className='text-base font-medium'>
								{t('amountLabel')}
							</Label>
							<Input
								id='amount'
								placeholder={t('amountPh')}
								value={formData.amount}
								onChange={(e) => handleInputChange('amount', e.target.value)}
								className='mt-2'
							/>
						</div>

						<div className='flex items-center space-x-2 mt-8'>
							<Checkbox
								id='requires_proof'
								checked={formData.requiresProof}
								onCheckedChange={(checked) =>
									handleInputChange('requiresProof', !!checked)
								}
							/>
							<Label htmlFor='requires_proof' className='text-base'>
								{t('requiresProof')}
							</Label>
						</div>
					</div>

					<div className='flex justify-end gap-3 pt-6 border-t'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={isLoading}
						>
							{t('cancel')}
						</Button>
						<Button
							type='submit'
							disabled={isLoading}
							className='bg-green-600 hover:bg-green-700 text-white'
						>
							{isLoading ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2' />
									{t('saving')}
								</>
							) : (
								<>
									<Save className='ml-2 h-4 w-4' />
									{t('save')}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
