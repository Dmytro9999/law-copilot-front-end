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

type Priority = 'low' | 'medium' | 'high' | 'urgent'

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
		priority: 'medium' as Priority,
		category: 'general',
		dueDate: undefined as Date | undefined,
		estimatedHours: '',
		tags: '',
		subtasks: [] as { description: string }[],
	})

	const canSubmit = Boolean(formData.contractId && formData.title.trim())

	const addSubtaskRow = () =>
		setFormData((p) => ({ ...p, subtasks: [...p.subtasks, { description: '' }] }))

	const updateSubtask = (i: number, v: string) =>
		setFormData((p) => {
			const copy = [...p.subtasks]
			copy[i] = { description: v }
			return { ...p, subtasks: copy }
		})

	const removeSubtask = (i: number) =>
		setFormData((p) => {
			const copy = [...p.subtasks]
			copy.splice(i, 1)
			return { ...p, subtasks: copy }
		})

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit) return

		const payload = {
			contractId: formData.contractId!.toString(), // уже проверили в canSubmit
			title: formData.title.trim(),
			description: formData.description.trim() || null,
			priority: Number(formData.priority),
			// если бек принимает category — уйдёт; если нет, можно убрать
			category: formData.category,
			dueDate: formData.dueDate ? formData.dueDate.toISOString().slice(0, 10) : null,
			estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
			tags: formData.tags
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			subtasks: formData.subtasks
				.map((s) => s.description.trim())
				.filter(Boolean)
				.map((d) => ({ description: d })),
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
				priority: 'medium',
				category: 'general',
				dueDate: undefined,
				estimatedHours: '',
				tags: '',
				subtasks: [],
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
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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

						<div className='space-y-2'>
							<Label htmlFor='category' className='text-lg font-medium'>
								{t('taskModal.category') || 'קטגוריה'}
							</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData({ ...formData, category: value })
								}
							>
								<SelectTrigger className='h-12 text-lg'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='general'>
										{t('taskModal.cat.general') || 'כללי'}
									</SelectItem>
									<SelectItem value='legal'>
										{t('taskModal.cat.legal') || 'משפטי'}
									</SelectItem>
									<SelectItem value='client'>
										{t('taskModal.cat.client') || 'לקוח'}
									</SelectItem>
									<SelectItem value='contract'>
										{t('taskModal.cat.contract') || 'חוזה'}
									</SelectItem>
									<SelectItem value='research'>
										{t('taskModal.cat.research') || 'מחקר'}
									</SelectItem>
									<SelectItem value='admin'>
										{t('taskModal.cat.admin') || 'אדמינ׳'}
									</SelectItem>
								</SelectContent>
							</Select>
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
									<SelectItem value='1'>
										{t('tasks.priority.low') || 'נמוכה'}
									</SelectItem>
									<SelectItem value='2'>
										{t('tasks.priority.medium') || 'בינונית'}
									</SelectItem>
									<SelectItem value='3'>
										{t('tasks.priority.high') || 'גבוהה'}
									</SelectItem>
									<SelectItem value='4'>
										{t('tasks.priority.urgent') || 'דחופה'}
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

						<div className='space-y-2'>
							<Label htmlFor='estimatedHours' className='text-lg font-medium'>
								{t('taskModal.estimatedHours') || 'שעות משוערות'}
							</Label>
							<Input
								id='estimatedHours'
								type='number'
								value={formData.estimatedHours}
								onChange={(e) =>
									setFormData({ ...formData, estimatedHours: e.target.value })
								}
								placeholder={t('taskModal.estimatedHoursPh') || 'מספר שעות'}
								className='h-12 text-lg'
								min='0'
								step='0.5'
							/>
						</div>
					</div>

					{/* Теги */}
					<div className='space-y-2'>
						<Label htmlFor='tags' className='text-lg font-medium'>
							{t('taskModal.tags') || 'תגיות (מופרדות בפסיק)'}
						</Label>
						<Input
							id='tags'
							value={formData.tags}
							onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
							placeholder={t('taskModal.tagsPh') || 'דחוף, חשוב, לקוח חדש...'}
							className='h-12 text-lg'
						/>
					</div>

					{/* Сабтаски */}
					<div className='space-y-2'>
						<Label className='text-lg font-medium'>
							{t('taskModal.subtasks') || 'תתי-משימות'}
						</Label>
						<div className='space-y-2'>
							{formData.subtasks.map((s, i) => (
								<div key={i} className='flex gap-2'>
									<Input
										value={s.description}
										onChange={(e) => updateSubtask(i, e.target.value)}
										placeholder={
											t('taskModal.subtaskPlaceholder') || 'תאר תת-משימה...'
										}
										className='h-10'
									/>
									<Button
										type='button'
										variant='outline'
										onClick={() => removeSubtask(i)}
										className='px-3'
										aria-label='Remove subtask'
									>
										×
									</Button>
								</div>
							))}
						</div>
						<Button
							type='button'
							variant='outline'
							onClick={addSubtaskRow}
							className='mt-1'
						>
							+ {t('taskModal.addSubtask') || 'הוסף תת-משימה'}
						</Button>
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
