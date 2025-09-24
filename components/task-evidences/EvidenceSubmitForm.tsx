'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/providers/I18nProvider'
import { useUploadDocumentMutation } from '@/store/features/contracts/contractsApi'
import { Loader2, Upload } from 'lucide-react'
import { useSubmitTaskEvidenceMutation } from '@/store/features/task-evidences/taskEvidencesApi'

type Props = {
	taskId: number
	disabled?: boolean
	onSubmitted?: (ev: any) => void // передайте refetch или локальный апдейт
}

export default function EvidenceSubmitForm({ taskId, disabled, onSubmitted }: Props) {
	const { t } = useI18n()
	const { toast } = useToast()
	const [message, setMessage] = useState('')
	const [file, setFile] = useState<File | null>(null)

	const [uploadDocument, { isLoading: upLoading }] = useUploadDocumentMutation()
	const [submitEvidence, { isLoading: evLoading }] = useSubmitTaskEvidenceMutation()

	const isBusy = upLoading || evLoading
	const canSubmit = Boolean(message.trim() && file && !disabled && !isBusy)

	async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0] || null
		setFile(f)
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit || !file) return

		try {
			// 1) upload file → get id
			const uploaded = await uploadDocument({ file, originalName: file.name }).unwrap()
			const fileId = Number(uploaded.id)

			// 2) submit evidence
			const res = await submitEvidence({
				taskId,
				message: message.trim(),
				fileId,
			}).unwrap()

			toast({
				title: t('taskView.evidence.form.toastOkTitle') || 'Submitted',
				description:
					t('taskView.evidence.form.toastOkDesc') || 'Evidence sent for approval',
				className: 'bg-green-600 text-white',
			})

			// reset
			setMessage('')
			setFile(null)
			onSubmitted?.(res)
		} catch (err: any) {
			toast({
				title: t('taskView.evidence.form.toastErrTitle') || 'Failed',
				description:
					err?.data?.message ||
					err?.message ||
					t('taskView.evidence.form.toastErrDesc') ||
					'Could not submit evidence',
				variant: 'destructive',
			})
		}
	}

	return (
		<form onSubmit={onSubmit} className='space-y-4 p-4 rounded-lg border bg-white/70'>
			<div className='space-y-2'>
				<Label className='font-medium'>
					{t('taskView.evidence.form.messageLabel') || 'Message'}
				</Label>
				<Textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={
						t('taskView.evidence.form.messagePh') || 'Describe your evidence...'
					}
					rows={3}
					disabled={disabled || isBusy}
				/>
			</div>

			<div className='space-y-2'>
				<Label className='font-medium'>
					{t('taskView.evidence.form.fileLabel') || 'Attachment'}
				</Label>
				<div className='flex items-center gap-3'>
					<Input type='file' onChange={onSelectFile} disabled={disabled || isBusy} />
					{file && (
						<span className='text-sm text-slate-600 truncate max-w-[50%]'>
							{file.name}
						</span>
					)}
				</div>
			</div>

			<div className='flex gap-3'>
				<Button
					type='submit'
					disabled={!canSubmit}
					className='bg-indigo-600 hover:bg-indigo-700 text-white'
				>
					{isBusy ? (
						<>
							<Loader2 className='h-4 w-4 ml-1 animate-spin' />
							{t('taskView.evidence.form.saving') || 'Submitting...'}
						</>
					) : (
						<>
							<Upload className='h-4 w-4 ml-1' />
							{t('taskView.evidence.form.submit') || 'Submit for approval'}
						</>
					)}
				</Button>
			</div>
		</form>
	)
}
