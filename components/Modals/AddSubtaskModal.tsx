// src/components/Modals/AddSubtaskModal.tsx
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
import { Loader2, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/providers/I18nProvider'
import { useCreateSubtaskMutation } from '@/store/features/tasks/tasksApi'
import type { CreateSubtaskPayload } from '@/store/features/tasks/tasksTypes'

interface AddSubtaskModalProps {
	isOpen: boolean
	onClose: () => void
	parentTaskId: number
	/** дерни после успешного создания, чтобы родитель сделал refetch */
	onCreated?: () => void
}

export default function AddSubtaskModal({
	isOpen,
	onClose,
	parentTaskId,
	onCreated,
}: AddSubtaskModalProps) {
	const { t } = useI18n()
	const { toast } = useToast()
	const [createSubtask, { isLoading }] = useCreateSubtaskMutation()

	const [form, setForm] = useState({
		title: '',
		description: '',
		priority: 'low',
		due_at: '',
		approval_required: false,
		assigneeIdsRaw: '',
	})

	const canSubmit = form.title.trim().length > 0

	function parseAssignees(raw: string): number[] | undefined {
		const arr = raw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((s) => Number(s))
			.filter((n) => Number.isFinite(n))
		return arr.length ? arr : undefined
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit) return

		if (form.approval_required) {
			const parsed = parseAssignees(form.assigneeIdsRaw || '')
			if (!parsed || parsed.length === 0) {
				toast({
					title: t('taskView.subtasksModal.assigneesRequired') || 'Assignees required',
					description:
						t('taskView.subtasksModal.assigneesRequiredDesc') ||
						'Add at least one assignee when approval is required.',
					variant: 'destructive',
				})
				return
			}
		}

		const body: CreateSubtaskPayload = {
			title: form.title.trim(),
			description: form.description.trim() || undefined,
			priority: form.priority,
			due_at: form.due_at || undefined, // формат YYYY-MM-DD из <input type="date" />
			approval_required: form.approval_required,
			assigneeIds: parseAssignees(form.assigneeIdsRaw || ''),
		}

		try {
			await createSubtask({ parentId: parentTaskId, body }).unwrap()
			toast({
				title: t('taskView.subtasksModal.created') || 'Subtask created',
				description:
					t('taskView.subtasksModal.createdDesc') || 'The subtask has been created.',
				className: 'bg-green-600 text-white',
			})
			// reset
			setForm({
				title: '',
				description: '',
				priority: 'low',
				due_at: '',
				approval_required: false,
				assigneeIdsRaw: '',
			})
			onClose()
			onCreated?.()
		} catch (err: any) {
			toast({
				title: t('taskView.subtasksModal.createFailed') || 'Failed to create subtask',
				description: err?.data?.message || err?.message || '',
				variant: 'destructive',
			})
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-3'>
						<Plus className='h-6 w-6 text-blue-600' />
						{t('taskView.subtasksModal.createTitle') || 'Create subtask'}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={onSubmit} className='space-y-5'>
					<div className='space-y-2'>
						<Label htmlFor='st-title'>
							{t('taskView.subtasksModal.fields.title') || 'Title'} *
						</Label>
						<Input
							id='st-title'
							value={form.title}
							onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
							placeholder={
								t('taskView.subtasksModal.fields.titlePh') ||
								'Enter subtask title...'
							}
							required
							className='h-12 text-lg'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='st-desc'>
							{t('taskView.subtasksModal.fields.description') || 'Description'}
						</Label>
						<Textarea
							id='st-desc'
							value={form.description}
							onChange={(e) =>
								setForm((p) => ({ ...p, description: e.target.value }))
							}
							placeholder={
								t('taskView.subtasksModal.fields.descriptionPh') ||
								'Describe the subtask...'
							}
							className='min-h-[100px]'
						/>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<Label>
								{t('taskView.subtasksModal.fields.priority') || 'Priority'}
							</Label>
							<Select
								value={form.priority}
								onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}
							>
								<SelectTrigger className='h-12'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='low'>
										{t('tasks.priority.low') || 'Low'}
									</SelectItem>
									<SelectItem value='medium'>
										{t('tasks.priority.medium') || 'Medium'}
									</SelectItem>
									<SelectItem value='high'>
										{t('tasks.priority.high') || 'High'}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='st-due'>{t('taskView.dueDate') || 'Due date'}</Label>
							<Input
								id='st-due'
								type='date'
								value={form.due_at}
								onChange={(e) => setForm((p) => ({ ...p, due_at: e.target.value }))}
								className='h-12'
							/>
						</div>

						<div className='space-y-2'>
							<Label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={form.approval_required}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											approval_required: e.target.checked,
										}))
									}
								/>
								{t('taskView.approvalRequired') || 'Approval required'}
							</Label>
							<Input
								disabled={!form.approval_required}
								value={form.assigneeIdsRaw}
								onChange={(e) =>
									setForm((p) => ({ ...p, assigneeIdsRaw: e.target.value }))
								}
								placeholder={
									t('taskView.subtasksModal.fields.assigneesPh') ||
									'Assignee IDs (comma-separated)'
								}
								className='h-12'
							/>
						</div>
					</div>

					<div className='flex gap-3 pt-2'>
						<Button
							type='submit'
							disabled={isLoading || !canSubmit}
							className='flex-1 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12'
						>
							{isLoading ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									{t('taskView.subtasksModal.saving') || 'Saving...'}
								</>
							) : (
								<>
									<Plus className='ml-2 h-5 w-5' />
									{t('taskView.subtasksModal.submit') || 'Create'}
								</>
							)}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={isLoading}
							className='h-12 px-6'
						>
							{t('taskView.subtasksModal.cancel') || 'Cancel'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
