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
import { useMeetingAnalyzeMutation } from '@/store/features/meeting-summary/meeting-summary'

/** ---- Типы ---- */
type AISummary = { summary: string; keyPoints?: string[] }
type LocalFile = {
	id: string
	file: File
	status: 'selected' | 'analyzing' | 'done' | 'error'
	url?: string | null // краткоживущая ссылка (под просмотр)
	error?: string | null
}

interface MeetingSummaryModalProps {
	isOpen: boolean
	onClose: () => void
	onSaveSummary: (summaryData: any) => void
	contracts: Array<{ id: number; name: string; client_name?: string }>
}

/** ---- Конфиг эндпоинта ---- */
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '' // напр.: https://api.example.com
const AI_ANALYZE_ENDPOINT = `${API_BASE}/ai/meeting-analyze` // Nest controller

/** ---- Утилиты ---- */
const formatBytes = (bytes: number) => {
	if (bytes === 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/** ---- Компонент ---- */
export default function MeetingSummaryModal({
	isOpen,
	onClose,
	onSaveSummary,
	contracts,
}: MeetingSummaryModalProps) {
	const { toast } = useToast()

	const [formData, setFormData] = useState({
		contractId: '',
		title: '',
		meetingDate: '',
		notes: '',
	})

	const [file, setFile] = useState<LocalFile | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [aiSummary, setAiSummary] = useState<AISummary | null>(null)

	const [meetingAnalyze, { isLoading: isAnalyzing }] = useMeetingAnalyzeMutation()

	const handleInputChange = (field: keyof typeof formData, value: string) =>
		setFormData((prev) => ({ ...prev, [field]: value }))

	/** ---- Выбор одного файла ---- */
	const onSelectFile = (fl: FileList | null) => {
		if (!fl || fl.length === 0) return
		const f = fl[0]
		setFile({ id: 'local-1', file: f, status: 'selected', url: null })
		// сбросим предыдущий анализ
		setAiSummary(null)
	}

	const removeFile = () => {
		if (isProcessing) return
		setFile(null)
		setAiSummary(null)
	}

	/** ---- AI Analyze: один POST multipart на бэк ---- */
	const handleAnalyze = async () => {
		if (!formData.title.trim()) {
			toast({ title: 'שגיאה', description: 'יש להזין כותרת', variant: 'destructive' })
			return
		}
		if (!formData.meetingDate) {
			toast({ title: 'שגיאה', description: 'בחר תאריך פגישה', variant: 'destructive' })
			return
		}
		if (!file) {
			toast({ title: 'שגיאה', description: 'בחר קובץ לפני ניתוח AI', variant: 'destructive' })
			return
		}

		// визуально покажем статус
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
				prev
					? {
							...prev,
							status: 'done',
							url: resp.document?.signedUrl || null, // если сервер вернул временную ссылку
						}
					: prev
			)
			setAiSummary(resp.ai)

			toast({
				title: 'הניתוח הושלם',
				description: 'סיכום AI נוצר',
				className: 'bg-gradient-to-l from-blue-600 to-purple-600 text-white border-none',
			})
		} catch (e: any) {
			setFile((prev) =>
				prev ? { ...prev, status: 'error', error: String(e?.message || e) } : prev
			)
			toast({
				title: 'שגיאה בניתוח',
				description: 'לא ניתן לבצע ניתוח AI. נסה שוב.',
				variant: 'destructive',
			})
		}
	}

	/** ---- Сохранение в систему ---- */
	const handleSave = () => {
		if (!formData.title.trim()) {
			toast({ title: 'שגיאה בטופס', description: 'נא למלא כותרת', variant: 'destructive' })
			return
		}
		if (!formData.meetingDate) {
			toast({
				title: 'שגיאה בטופס',
				description: 'נא לבחור תאריך פגישה',
				variant: 'destructive',
			})
			return
		}

		const fallback: AISummary = {
			summary: formData.notes.trim()
				? formData.notes.trim()
				: `סיכום קצר לפגישה "${formData.title}" (ללא ניתוח AI).`,
			keyPoints: [],
		}

		const summaryData = {
			contractId: formData.contractId ? Number.parseInt(formData.contractId) : null,
			title: formData.title.trim(),
			meetingDate: formData.meetingDate,
			notes: formData.notes,
			document: file
				? {
						url: file.url || null, // краткоживущая ссылка (если сервер прислал)
						name: file.file.name,
						size: file.file.size,
						mime: file.file.type,
						status: file.status,
					}
				: null,
			ai: aiSummary || fallback,
		}

		onSaveSummary(summaryData)
	}

	const fileSelected = Boolean(file)
	const canAnalyze = fileSelected && !isProcessing
	const uploaded = useMemo(() => (file?.status === 'done' ? 1 : 0), [file])

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
						<Brain className='h-6 w-6 text-blue-600' />
						סיכום פגישה
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* ---- Форма ---- */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='contractId'>חוזה קשור (לא חובה)</Label>
							<Select
								value={formData.contractId}
								onValueChange={(value) => handleInputChange('contractId', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder='בחר חוזה' />
								</SelectTrigger>
								<SelectContent>
									{contracts.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											{c.name}
											{c.client_name ? ` — ${c.client_name}` : ''}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='meetingDate'>תאריך פגישה *</Label>
							<Input
								id='meetingDate'
								type='date'
								value={formData.meetingDate}
								onChange={(e) => handleInputChange('meetingDate', e.target.value)}
							/>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='title'>כותרת *</Label>
							<Input
								id='title'
								placeholder='לדוגמה: פגישה עם הלקוח X'
								value={formData.title}
								onChange={(e) => handleInputChange('title', e.target.value)}
							/>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='notes'>הערות / מה חשוב להדגיש (אופציונלי)</Label>
							<Textarea
								id='notes'
								placeholder='כתוב בקצרה מה עלה בפגישה או מה חשוב להוציא מהמסמך...'
								value={formData.notes}
								onChange={(e) => handleInputChange('notes', e.target.value)}
								rows={5}
								className='resize-none'
							/>
						</div>
					</div>

					{/* ---- Один файл (без отдельной кнопки Upload) ---- */}
					<div className='space-y-3'>
						<Label>מסמך אחד (כל סוג קובץ)</Label>
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
												? 'נותח'
												: file.status === 'analyzing'
													? 'מנתח...'
													: file.status === 'error'
														? 'שגיאה'
														: 'נבחר'}
										</Badge>
										<Button
											size='icon'
											variant='ghost'
											onClick={removeFile}
											disabled={file.status === 'analyzing'}
											className='h-8 w-8'
											title='הסר קובץ'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</div>
								{file.url && (
									<div className='text-xs text-slate-500'>
										קישור זמני לצפייה:{' '}
										<a className='underline' href={file.url} target='_blank'>
											פתח
										</a>
									</div>
								)}
								<div className='text-xs text-slate-500'>{uploaded}/1 הסתיים</div>
							</div>
						)}
					</div>

					{/* ---- Кнопка AI Analyze ---- */}
					<div className='flex justify-center'>
						<Button
							onClick={handleAnalyze}
							disabled={!file || isAnalyzing}
							className='bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg'
						>
							{isAnalyzing ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									AI מנתח...
								</>
							) : (
								<>
									<Sparkles className='ml-2 h-5 w-5' />
									AI Analyze
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
									תוצאות ניתוח AI
								</h3>
								<Badge className='bg-green-100 text-green-800 border-green-200'>
									<CheckCircle2 className='h-3 w-3 ml-1' />
									הושלם
								</Badge>
							</div>

							<Card className='bg-blue-50/50 border-blue-200'>
								<CardHeader className='pb-3'>
									<CardTitle className='text-sm font-semibold text-blue-800'>
										סיכום
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
											נקודות עיקריות
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

					{/* ---- Сохранить ---- */}
					<div className='flex justify-end gap-3 pt-4 border-t'>
						<Button variant='outline' onClick={onClose}>
							ביטול
						</Button>
						<Button
							onClick={handleSave}
							className='bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
						>
							<CheckCircle2 className='ml-2 h-4 w-4' />
							שמור סיכום
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
