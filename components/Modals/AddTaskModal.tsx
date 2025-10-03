'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/providers/I18nProvider'
import { useToast } from '@/components/ui/use-toast'
import { useCreateTaskMutation } from '@/store/features/tasks/tasksApi'

type Priority = 'low' | 'medium' | 'high'

interface AddTaskModalProps {
	isOpen: boolean
	onClose: () => void
	/** список контрактов для селекта */
	contracts: Array<{ id: number; title: string }>
	/** дерни это после успешного создания, чтобы родитель сделал refetch */
	onCreated?: () => void
}

export default function AddTaskModal({ isOpen, onClose, contracts, onCreated }: AddTaskModalProps) {
	const { t } = useI18n()
	const { toast } = useToast()
	const [createTask, { isLoading }] = useCreateTaskMutation()

	const [formData, setFormData] = useState({
		contractId: undefined as number | undefined,
		title: '',
		description: '',
		priority: 'low' as Priority,
		dueDate: undefined as Date | undefined,
		approval_required: false,
		assigneeIdsRaw: '',
	})

	const canSubmit = Boolean(formData.title.trim())
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit) return

		const payload = {
			contractId: formData.contractId ? Number(formData.contractId) : null,
			title: formData.title.trim(),
			description: formData.description.trim() || null,
			priority: formData.priority,
			due_at: formData.dueDate ? formData.dueDate.toISOString().slice(0, 10) : null,
			approval_required: formData.approval_required,
			assigneeIds: [3],
		}

		try {
			await createTask(payload).unwrap()

			toast({
				title: t('taskModal.createdTitle') || 'נוצרה משימה',
				description: t('taskModal.createdDesc') || 'המשימה נשמרה בהצלחה',
			})

			// сброс/закрытие
			setFormData({
				contractId: undefined,
				title: '',
				description: '',
				priority: 'low',
				dueDate: undefined,
				approval_required: false,
				assigneeIdsRaw: '',
			})
			onClose()
			onCreated?.()
		} catch (err: any) {
			toast({
				title: t('taskModal.toastError') || 'שמירת המשימה נכשלה',
				description: err?.data?.message || err?.message || '',
				variant: 'destructive',
			})
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-3'>
						<Plus className='h-6 w-6 text-blue-600' />
						{t('taskModal.title') || 'הוספת משימה חדשה'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-6 mt-6'>
					{/* Контракт */}
					<div className='space-y-2'>
						<Label className='text-lg font-medium'>
							{t('taskModal.contractLabel') || 'חוזה'}
						</Label>
						<Select
							value={formData.contractId ? String(formData.contractId) : undefined}
							onValueChange={(v) =>
								setFormData((p) => ({ ...p, contractId: Number(v) }))
							}
						>
							<SelectTrigger className='h-12 text-lg'>
								<SelectValue
									placeholder={t('taskModal.contractPlaceholder') || 'בחר חוזה'}
								/>
							</SelectTrigger>
							<SelectContent>
								{contracts.map((c) => (
									<SelectItem key={c.id} value={String(c.id)}>
										{c.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Заголовок + Категория */}
					<div className='space-y-2'>
						<div className='space-y-2'>
							<Label htmlFor='title' className='text-lg font-medium'>
								{t('taskModal.titleLabel') || 'כותרת המשימה'} *
							</Label>
							<Input
								id='title'
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder={t('taskModal.titlePh') || 'הכנס כותרת למשימה...'}
								className='h-12 text-lg'
								required
							/>
						</div>
					</div>

					{/* Описание */}
					<div className='space-y-2'>
						<Label htmlFor='description' className='text-lg font-medium'>
							{t('taskModal.description') || 'תיאור המשימה'}
						</Label>
						<Textarea
							id='description'
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder={t('taskModal.descriptionPh') || 'תאר את המשימה בפירוט...'}
							className='min-h-[120px] text-lg'
						/>
					</div>

					{/* Приоритет / Дата / Часы */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='space-y-2'>
							<Label htmlFor='priority' className='text-lg font-medium'>
								{t('taskModal.priority') || 'עדיפות'}
							</Label>
							<Select
								value={formData.priority}
								onValueChange={(value: Priority) =>
									setFormData({ ...formData, priority: value })
								}
							>
								<SelectTrigger className='h-12 text-lg'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='low'>
										{t('tasks.priority.low') || 'נמוכה'}
									</SelectItem>
									<SelectItem value='medium'>
										{t('tasks.priority.medium') || 'בינונית'}
									</SelectItem>
									<SelectItem value='high'>
										{t('tasks.priority.high') || 'גבוהה'}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label className='text-lg font-medium'>
								{t('taskModal.dueDate') || 'תאריך יעד'}
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											'w-full h-12 text-lg justify-start text-right font-normal',
											!formData.dueDate && 'text-muted-foreground'
										)}
									>
										<CalendarIcon className='ml-2 h-5 w-5' />
										{formData.dueDate
											? format(formData.dueDate, 'PPP', { locale: he })
											: t('taskModal.pickDate') || 'בחר תאריך'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0' align='start'>
									<Calendar
										mode='single'
										selected={formData.dueDate}
										onSelect={(date) =>
											setFormData({ ...formData, dueDate: date || undefined })
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className='space-y-2'>
						<Label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={formData.approval_required}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										approval_required: e.target.checked,
									}))
								}
							/>
							{t('taskView.approvalRequired') || 'Approval required'}
						</Label>
						<Input
							disabled={!formData.approval_required}
							value={formData.assigneeIdsRaw}
							onChange={(e) =>
								setFormData((p) => ({ ...p, assigneeIdsRaw: e.target.value }))
							}
							placeholder={
								t('taskView.subtasksModal.fields.assigneesPh') ||
								'Assignee IDs (comma-separated)'
							}
							className='h-12'
						/>
					</div>

					{/* Кнопки */}
					<div className='flex gap-4 pt-6'>
						<Button
							type='submit'
							disabled={isLoading || !canSubmit}
							className='flex-1 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 text-lg'
						>
							{isLoading ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									{t('taskModal.saving') || 'שומר...'}
								</>
							) : (
								<>
									<Plus className='ml-2 h-5 w-5' />
									{t('taskModal.submit') || 'צור משימה'}
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
							{t('taskModal.cancel') || 'ביטול'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
