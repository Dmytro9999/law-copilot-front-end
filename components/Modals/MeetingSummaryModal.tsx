'use client'

import React, { useMemo, useState } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Loader2, Sparkles, Brain, CheckCircle2, X, FileText } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useI18n, useLocale } from '@/providers/I18nProvider'
import {
	useCreateMeetingSummaryMutation,
	useMeetingAnalyzeMutation,
} from '@/store/features/meeting-summary/meeting-summary'

/** ---- Типы ---- */
type AISummary = { summary: string; keyPoints?: string[] }
type LocalFile = {
	id: string
	file: File
	status: 'selected' | 'analyzing' | 'done' | 'error'
	url?: string | null
	error?: string | null
}
type ContractOption = { id: number | string; label: string }

interface MeetingSummaryModalProps {
	isOpen: boolean
	onClose: () => void
	onSaveSummary: (summaryData: any) => void
	contracts: Array<ContractOption>
}

/** ---- Утилиты ---- */
const formatBytes = (bytes: number) => {
	if (bytes === 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function MeetingSummaryModal({
	isOpen,
	onClose,
	onSaveSummary,
	contracts,
}: MeetingSummaryModalProps) {
	const { t } = useI18n()
	const locale = useLocale()
	const dir = locale === 'he' ? 'rtl' : 'ltr'
	const { toast } = useToast()

	// formatter для "{var}" подстановок
	const tf = (key: string, fallback: string, vars?: Record<string, string | number>) => {
		let s = t(key, fallback) as string
		if (vars)
			Object.entries(vars).forEach(([k, v]) => {
				s = s.replaceAll(`{${k}}`, String(v))
			})
		return s
	}

	const [formData, setFormData] = useState({
		contractId: '',
		title: '',
		meetingDate: '',
		notes: '',
	})

	const [file, setFile] = useState<LocalFile | null>(null)
	const [aiSummary, setAiSummary] = useState<AISummary | null>(null)

	const [meetingAnalyze, { isLoading: isAnalyzing }] = useMeetingAnalyzeMutation()
	const [createMeetingRecord, { isLoading: isSaving }] = useCreateMeetingSummaryMutation()

	const handleInputChange = (field: keyof typeof formData, value: string) =>
		setFormData((prev) => ({ ...prev, [field]: value }))

	/** ---- Выбор файла ---- */
	const onSelectFile = (fl: FileList | null) => {
		if (!fl || fl.length === 0) return
		const f = fl[0]
		setFile({ id: 'local-1', file: f, status: 'selected', url: null })
		setAiSummary(null)
	}

	const removeFile = () => {
		if (isAnalyzing) return
		setFile(null)
		setAiSummary(null)
	}

	/** ---- AI Analyze ---- */
	const handleAnalyze = async () => {
		if (!formData.title.trim()) {
			toast({
				title: t('meetingSummaryModal.errors.titleRequired', 'Title is required'),
				variant: 'destructive',
			})
			return
		}
		if (!formData.meetingDate) {
			toast({
				title: t('meetingSummaryModal.errors.dateRequired', 'Meeting date is required'),
				variant: 'destructive',
			})
			return
		}
		if (!file) {
			toast({
				title: t('meetingSummaryModal.errors.fileRequired', 'Select a file first'),
				variant: 'destructive',
			})
			return
		}

		setFile((prev) => (prev ? { ...prev, status: 'analyzing', error: null } : prev))
		setAiSummary(null)

		try {
			const resp = await meetingAnalyze({
				file: file.file,
				title: formData.title.trim(),
				meetingDate: formData.meetingDate,
				notes: formData.notes || undefined,
				contractId: formData.contractId || undefined,
			}).unwrap()

			setFile((prev) =>
				prev ? { ...prev, status: 'done', url: resp.document?.signedUrl || null } : prev
			)
			setAiSummary(resp.ai)

			toast({
				title: t('meetingSummaryModal.toasts.analyzeSuccess.title', 'Analysis complete'),
				description: t(
					'meetingSummaryModal.toasts.analyzeSuccess.desc',
					'AI summary generated'
				),
				className: 'bg-gradient-to-l from-blue-600 to-purple-600 text-white border-none',
			})
		} catch (e: any) {
			setFile((prev) =>
				prev ? { ...prev, status: 'error', error: String(e?.message || e) } : prev
			)
			toast({
				title: t('meetingSummaryModal.toasts.analyzeFailed.title', 'Analysis failed'),
				description: t(
					'meetingSummaryModal.toasts.analyzeFailed.desc',
					'Could not analyze the file. Try again.'
				),
				variant: 'destructive',
			})
		}
	}

	/** ---- Сохранение ---- */
	const handleSave = async () => {
		if (!formData.title.trim()) {
			toast({
				title: t('meetingSummaryModal.errors.titleRequired', 'Title is required'),
				variant: 'destructive',
			})
			return
		}
		if (!formData.meetingDate) {
			toast({
				title: t('meetingSummaryModal.errors.dateRequired', 'Meeting date is required'),
				variant: 'destructive',
			})
			return
		}

		try {
			const payload = {
				contractId: formData.contractId ? Number(formData.contractId) : null,
				title: formData.title.trim(),
				meetingDate: formData.meetingDate,
				notes: formData.notes || null,
				summary: (
					aiSummary?.summary ||
					formData.notes ||
					tf('meetingSummaryModal.fallback.summary', 'Short summary for "{title}"', {
						title: formData.title,
					})
				).trim(),
				keyPoints: aiSummary?.keyPoints || [],
			}

			const saved = await createMeetingRecord(payload).unwrap()

			toast({
				title: t('meetingSummaryModal.toasts.saveSuccess.title', 'Saved'),
				description: tf('meetingSummaryModal.toasts.saveSuccess.desc', 'ID: {id}', {
					id: String(saved.id),
				}),
				className: 'bg-gradient-to-l from-green-600 to-emerald-600 text-white border-none',
			})

			onSaveSummary?.(saved)
			onClose()
		} catch (e: any) {
			toast({
				title: t('meetingSummaryModal.toasts.saveFailed.title', 'Save failed'),
				description: String(e?.data?.message || e?.message || ''),
				variant: 'destructive',
			})
		}
	}

	const uploaded = useMemo(() => (file?.status === 'done' ? 1 : 0), [file])

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto' dir={dir}>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
						<Brain className='h-6 w-6 text-blue-600' />
						{t('meetingSummaryModal.title', 'Meeting summary')}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* ---- Форма ---- */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='contractId'>
								{t(
									'meetingSummaryModal.fields.contract',
									'Related contract (optional)'
								)}
							</Label>
							<Select
								value={formData.contractId}
								onValueChange={(value) => handleInputChange('contractId', value)}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t(
											'meetingSummaryModal.fields.contractPh',
											'Select a contract'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{contracts?.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='meetingDate'>
								{t('meetingSummaryModal.fields.date', 'Meeting date')} *
							</Label>
							<Input
								id='meetingDate'
								type='date'
								value={formData.meetingDate}
								onChange={(e) => handleInputChange('meetingDate', e.target.value)}
							/>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='title'>
								{t('meetingSummaryModal.fields.title', 'Title')} *
							</Label>
							<Input
								id='title'
								placeholder={t(
									'meetingSummaryModal.fields.titlePh',
									'e.g., Meeting with client X'
								)}
								value={formData.title}
								onChange={(e) => handleInputChange('title', e.target.value)}
							/>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='notes'>
								{t('meetingSummaryModal.fields.notes', 'Notes / focus (optional)')}
							</Label>
							<Textarea
								id='notes'
								placeholder={t(
									'meetingSummaryModal.fields.notesPh',
									'Briefly write what was discussed or what should be extracted...'
								)}
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								rows={5}
								className='resize-none'
							/>
						</div>
					</div>

					{/* ---- Один файл ---- */}
					<div className='space-y-3'>
						<Label>
							{t('meetingSummaryModal.file.label', 'Single document (any file type)')}
						</Label>
						<Input
							type='file'
							onChange={(e) => onSelectFile(e.target.files)}
							className='max-w-lg'
						/>

						{file && (
							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border bg-white p-3'>
									<div className='flex items-center gap-3'>
										<FileText className='h-4 w-4 text-slate-500' />
										<div className='text-sm'>
											<div className='font-medium text-slate-800'>
												{file.file.name}
											</div>
											<div className='text-slate-500 text-xs'>
												{file.file.type || 'unknown'} ·{' '}
												{formatBytes(file.file.size)}
											</div>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<Badge
											className={
												file.status === 'done'
													? 'bg-green-100 text-green-800 border-green-200'
													: file.status === 'analyzing'
														? 'bg-amber-100 text-amber-800 border-amber-200'
														: file.status === 'error'
															? 'bg-red-100 text-red-800 border-red-200'
															: 'bg-slate-100 text-slate-800 border-slate-200'
											}
										>
											{file.status === 'done'
												? t(
														'meetingSummaryModal.file.status.done',
														'Analyzed'
													)
												: file.status === 'analyzing'
													? t(
															'meetingSummaryModal.file.status.analyzing',
															'Analyzing…'
														)
													: file.status === 'error'
														? t(
																'meetingSummaryModal.file.status.error',
																'Error'
															)
														: t(
																'meetingSummaryModal.file.status.selected',
																'Selected'
															)}
										</Badge>
										<Button
											size='icon'
											variant='ghost'
											onClick={removeFile}
											disabled={file.status === 'analyzing'}
											className='h-8 w-8'
											title={t(
												'meetingSummaryModal.file.remove',
												'Remove file'
											)}
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</div>

								{file.url && (
									<div className='text-xs text-slate-500'>
										{t(
											'meetingSummaryModal.file.tempLink',
											'Temporary view link:'
										)}{' '}
										<a className='underline' href={file.url} target='_blank'>
											{t('meetingSummaryModal.file.open', 'Open')}
										</a>
									</div>
								)}

								<div className='text-xs text-slate-500'>
									{tf('meetingSummaryModal.file.progress', '{done}/1 completed', {
										done: uploaded,
									})}
								</div>
							</div>
						)}
					</div>

					{/* ---- AI Analyze ---- */}
					<div className='flex justify-center'>
						<Button
							onClick={handleAnalyze}
							disabled={!file || isAnalyzing}
							className='bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg'
						>
							{isAnalyzing ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									{t('meetingSummaryModal.actions.analyzing', 'AI analyzing…')}
								</>
							) : (
								<>
									<Sparkles className='ml-2 h-5 w-5' />
									{t('meetingSummaryModal.actions.analyze', 'AI Analyze')}
								</>
							)}
						</Button>
					</div>

					{/* ---- Результат AI ---- */}
					{aiSummary && (
						<div className='space-y-4'>
							<div className='flex items-center gap-2 mb-2'>
								<Brain className='h-5 w-5 text-blue-600' />
								<h3 className='text-lg font-bold text-slate-800'>
									{t('meetingSummaryModal.ai.resultTitle', 'AI analysis results')}
								</h3>
								<Badge className='bg-green-100 text-green-800 border-green-200'>
									<CheckCircle2 className='h-3 w-3 ml-1' />
									{t('meetingSummaryModal.ai.completed', 'Completed')}
								</Badge>
							</div>

							<Card className='bg-blue-50/50 border-blue-200'>
								<CardHeader className='pb-3'>
									<CardTitle className='text-sm font-semibold text-blue-800'>
										{t('meetingSummaryModal.ai.summaryTitle', 'Summary')}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-sm text-slate-700'>{aiSummary.summary}</p>
								</CardContent>
							</Card>

							{aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
								<Card className='bg-purple-50/50 border-purple-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-purple-800'>
											{t(
												'meetingSummaryModal.ai.keyPointsTitle',
												'Key points'
											)}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className='space-y-1'>
											{aiSummary.keyPoints.map((p, i) => (
												<li
													key={i}
													className='text-sm text-slate-700 flex items-start gap-2'
												>
													<span className='text-purple-600'>•</span>
													{p}
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							)}
						</div>
					)}

					{/* ---- Actions ---- */}
					<div className='flex justify-end gap-3 pt-4 border-t'>
						<Button variant='outline' onClick={onClose}>
							{t('meetingSummaryModal.actions.cancel', 'Cancel')}
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className='bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
						>
							{isSaving ? (
								<>
									<Loader2 className='ml-2 h-4 w-4 animate-spin' />
									{t('meetingSummaryModal.actions.saving', 'Saving...')}
								</>
							) : (
								<>
									<CheckCircle2 className='ml-2 h-4 w-4' />
									{t('meetingSummaryModal.actions.save', 'Save summary')}
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
