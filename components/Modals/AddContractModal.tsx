'use client'

import React, { useEffect } from 'react'

import { useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
import {
	Upload,
	FileText,
	Loader2,
	Brain,
	CheckCircle2,
	Calendar,
	Building2,
	Users,
	DollarSign,
	Plus,
	Sparkles,
	X,
	Target,
	AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { processFile, isSupportedFile, type ProcessedFile } from '@/lib/file-processor'
import { Pencil, Save, Trash2 } from 'lucide-react'

import {
	TaskFromAnalysisDto,
	useAnalyzeContractMutation,
	useExtractDocumentTextMutation,
	useMaterializeContractMutation,
	useUploadDocumentMutation,
} from '@/store/features/contracts/contractsApi'
import { useI18n, useLocale } from '@/providers/I18nProvider'
import ManualObligationModal from '@/components/Modals/AddObligationModal'
import ContractRisksEditor from '@/components/contracts/ContractRisksEditor'
import { useCreateRiskArrayMutation, useCreateRiskMutation } from '@/store/features/risks/risksApi'
import { TaskPriority } from '@/store/features/tasks/tasksTypes'
import UserSearchSelect from '@/components/contracts/UserSearchSelect'

interface AddContractModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (contractData: any) => void
}

interface ContractAnalysis {
	contractName: string
	partyA: {
		name: string
		idNumber: string
		address: string
		role: string
	}
	partyB: {
		name: string
		idNumber: string
		address: string
		role: string
	}
	contractType: string
	startDate: string | null
	endDate: string | null
	value: string | null
	description: string
	obligations: Array<{
		id: string
		description: string
		responsibleParty: string
		dueDate: string | null
		priority: string
		category: string
		requiresProof: boolean
		amount: string | null
		sourceText: string
		type: string
	}>
	keyTerms: Array<{
		term: string
		definition: string
		importance: string
	}>
	riskFactors: string[]
	recommendations: string[]
}

export default function AddContractModal({ isOpen, onClose, onSave }: AddContractModalProps) {
	const [formData, setFormData] = useState({
		name: '',
		client_name: '',
		client_email: '',
		client_phone: '',
		contract_type: '',
		start_date: '',
		end_date: '',
		total_value: '',
		description: '',
		status: 'active',
	})
	const [file, setFile] = useState<File | null>(null)
	const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null)
	const [contractText, setContractText] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [processingStage, setProcessingStage] = useState('')
	const [processingProgress, setProcessingProgress] = useState(0)
	const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null)
	const [dragActive, setDragActive] = useState(false)
	const [isManualObligationModalOpen, setManualObligationModalOpen] = useState(false)
	const [isTimerModalOpen, setTimerModalOpen] = useState(false)
	const [selectedObligation, setSelectedObligation] = useState(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { toast } = useToast()
	const [obligations, setObligations] = useState<any[]>([])
	const [editingKey, setEditingKey] = useState<string>('')

	const [uploadDocument] = useUploadDocumentMutation()
	const [analyzeContract] = useAnalyzeContractMutation()
	const [materializeContract] = useMaterializeContractMutation()
	const [createRisk] = useCreateRiskArrayMutation()
	const [extractDoc] = useExtractDocumentTextMutation()

	const [actorMap, setActorMap] = useState({})
	const [customActors, setCustomActors] = useState<string[]>([])

	const { t } = useI18n()

	useEffect(() => {
		if (contractAnalysis?.obligations) {
			setObligations(
				contractAnalysis.obligations.map((ob: any, i: number) => ({
					...ob,
					_key: ob.id ?? `tmp-${i}`,
				}))
			)
		} else {
			setObligations([])
		}
		setEditingKey('')
	}, [contractAnalysis])

	useEffect(() => {
		if (!contractAnalysis) {
			setActorMap({})
			return
		}
		const keys = extractActorKeys(contractAnalysis)
		setActorMap((prev) => {
			const next = { ...prev }
			for (const label of keys) {
				if (!(label in next)) next[label] = null
			}
			return next
		})
	}, [contractAnalysis])

	const startEdit = (key: string) => setEditingKey(key)
	const cancelEdit = () => setEditingKey('')

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const updateObligation = (key: string, patch: Partial<any>) => {
		setObligations((prev) => prev.map((ob) => (ob._key === key ? { ...ob, ...patch } : ob)))
	}

	const saveObligation = (key: string) => {
		setEditingKey('')
		setContractAnalysis((prev) => (prev ? { ...prev, obligations } : prev))
		toast({
			title: 'נשמר',
			description: 'ההתחייבות עודכנה',
			className: 'bg-green-500 text-white',
		})
	}

	const deleteObligation = (key: string) => {
		const next = obligations.filter((ob) => ob._key !== key)
		setObligations(next)
		setContractAnalysis((prev) => (prev ? { ...prev, obligations: next } : prev))
		toast({
			title: 'נמחק',
			description: 'ההתחייבות הוסרה מהרשימה',
			variant: 'destructive',
		})
	}

	type Priority = 'low' | 'medium' | 'high' | null | undefined
	function extractActorKeys(analysis: any): string[] {
		if (!analysis?.obligations) return []
		const set = new Set<string>()
		for (const ob of analysis.obligations) {
			const raw = String(ob?.responsibleParty || '').trim()
			if (!raw) continue
			const k = normActorKey(raw)
			if (!k) continue
			// храним «как есть» исходную метку, но уникализируем по нормализованному ключу
			if (![...set].some((s) => normActorKey(s) === k)) set.add(raw)
		}
		return [...set]
	}

	const actorOptions = React.useMemo(() => {
		const fromAi = extractActorKeys(contractAnalysis)
		const all = [...fromAi, ...customActors]
		const uniq: string[] = []
		for (const v of all) {
			if (!uniq.some((u) => normActorKey(u) === normActorKey(v))) uniq.push(v)
		}
		// на вкус: сортировка по алфавиту
		return uniq.sort((a, b) => a.localeCompare(b))
	}, [contractAnalysis, customActors])

	function normActorKey(x?: string | null) {
		return String(x || '')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim()
	}

	const priorityLabel = (p: Priority, t: (k: string) => string) =>
		p ? t(`tasks.priority.${p}`) || p : '—'

	const fmtDate = (s?: string | null) => {
		if (!s) return '—'
		const d = new Date(s)
		return isNaN(+d) ? s : d.toLocaleDateString()
	}

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		const files = e.dataTransfer.files
		if (files && files[0]) {
			handleFileSelect(files[0])
		}
	}

	const handleFileSelect = async (selectedFile: File) => {
		const maxSize = 10 * 1024 * 1024 // 10MB
		if (selectedFile.size > maxSize) {
			toast({
				title: 'קובץ גדול מדי',
				description: 'גודל הקובץ לא יכול לעלות על 10MB',
				variant: 'destructive',
			})
			return
		}

		if (!isSupportedFile(selectedFile)) {
			toast({
				title: 'סוג קובץ לא נתמך',
				description: 'נא להעלות קובץ PDF, Word או טקסט',
				variant: 'destructive',
			})
			return
		}

		setFile(selectedFile)

		// עיבוד הקובץ מיידי
		await processFileContent(selectedFile)
	}

	function AddActorInline({
		onAdd,
		suggestionBase = 'Сторона',
	}: {
		onAdd: (label: string) => void
		suggestionBase?: string
	}) {
		const [val, setVal] = useState('')

		// простая подсказка следующей буквы, если уже есть А/Б/В...
		const nextSuggestions = ['А', 'Б', 'В', 'Г', 'Д', 'E', 'F', 'G'].map(
			(ch) => `${suggestionBase} ${ch}`
		)

		return (
			<div className='flex items-center gap-2'>
				<input
					className='flex-1 border rounded-md px-3 py-2 text-sm'
					placeholder='Новая персона (например, «Сторона В»)'
					value={val}
					onChange={(e) => setVal(e.target.value)}
				/>
				<Button
					type='button'
					onClick={() => {
						const label = val.trim()
						if (!label) return
						onAdd(label)
						setVal('')
					}}
				>
					Добавить
				</Button>
				{/* быстрые подсказки (опционально) */}
				<div className='hidden md:flex items-center gap-1'>
					{nextSuggestions.map((s) => (
						<button
							key={s}
							type='button'
							className='text-xs px-2 py-1 border rounded hover:bg-slate-50'
							onClick={() => {
								onAdd(s)
							}}
						>
							{s}
						</button>
					))}
				</div>
			</div>
		)
	}

	function addCustomActor(label: string) {
		// запретим дубли по нормализованному ключу
		if (actorOptions.some((x) => normActorKey(x) === normActorKey(label))) return
		setCustomActors((prev) => [...prev, label])
		setActorMap((prev) => ({ ...prev, [label]: null }))
	}

	function removeCustomActor(label: string) {
		setCustomActors((prev) => prev.filter((x) => normActorKey(x) !== normActorKey(label)))
		setActorMap((prev) => {
			const copy = { ...prev }
			delete copy[label]
			return copy
		})
		// было: responsibleParty: ''
		setObligations((prev) =>
			prev.map((ob) =>
				normActorKey(ob.responsibleParty) === normActorKey(label)
					? { ...ob, responsibleParty: null }
					: ob
			)
		)
	}

	function splitIntoChunks(text: string) {
		const chunks: {
			id: string
			text: string
			startIndex: number
			endIndex: number
			type: 'paragraph' | 'header' | 'list' | 'table'
			confidence: number
		}[] = []
		const maxChunkSize = 1200
		const overlap = 120
		const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

		let current = ''
		let chunkIndex = 0
		let startIndex = 0

		const detectType = (t: string): 'paragraph' | 'header' | 'list' | 'table' => {
			if (t.length < 100 && (/^[A-Za-zА-Яа-яЁёא-ת\d.\s-]+$/.test(t) || /^\d+\./.test(t)))
				return 'header'
			if (
				/^[\d\u2022\u2023\u25E6\u25AA\u25AB-]/.test(t) ||
				t.includes('\n• ') ||
				t.includes('\n- ')
			)
				return 'list'
			if ((t.match(/\t/g) || []).length > 3 || (t.match(/\|/g) || []).length > 3)
				return 'table'
			return 'paragraph'
		}

		for (const p of paragraphs) {
			if (current.length + p.length > maxChunkSize && current.length > 0) {
				chunks.push({
					id: `chunk-${chunkIndex}`,
					text: current.trim(),
					startIndex,
					endIndex: startIndex + current.length,
					type: detectType(current),
					confidence: 0.9,
				})
				const overlapText = current.slice(-overlap)
				startIndex += current.length - overlapText.length
				current = overlapText + '\n' + p
				chunkIndex++
			} else {
				current += (current ? '\n' : '') + p
			}
		}
		if (current.trim()) {
			chunks.push({
				id: `chunk-${chunkIndex}`,
				text: current.trim(),
				startIndex,
				endIndex: startIndex + current.length,
				type: detectType(current),
				confidence: 0.9,
			})
		}
		return chunks
	}

	const processFileContent = async (fileToProcess: File) => {
		setIsProcessing(true)
		setProcessingProgress(0)
		setProcessingStage('מעבד קובץ...')

		try {
			// שלב 1: עיבוד הקובץ וחילוץ טקסט (теперь на бэке через RTK)
			setProcessingStage('חולץ טקסט מהקובץ...')
			setProcessingProgress(20)

			const { text, metadata } = await extractDoc({ file: fileToProcess }).unwrap()

			// собираем объект как раньше (добавляем chunks на фронте)
			const processed = {
				text,
				metadata,
				chunks: splitIntoChunks(text),
			}
			setProcessedFile(processed)
			setContractText(processed.text)

			toast({
				title: 'קובץ עובד בהצלחה! 📄',
				description: `חולצו ${processed.metadata.wordCount} מילים מ-${processed.chunks.length} קטעים`,
				className: 'bg-gradient-to-l from-green-600 to-emerald-600 text-white border-none',
			})

			// שלב 2: ניתוח עם AI
			setProcessingStage('Contract Analyst with OpenAi...')
			setProcessingProgress(50)

			await analyzeContractWithAI(processed.text, fileToProcess.name)
		} catch (error: any) {
			console.error('Error processing file:', error)
			toast({
				title: 'שגיאה בעיבוד הקובץ',
				description: error?.data?.message || error?.message || 'נסה שוב או הזן טקסט ידנית',
				variant: 'destructive',
			})
		} finally {
			setIsProcessing(false)
			setProcessingProgress(0)
			setProcessingStage('')
		}
	}

	const analyzeContractWithAI = async (textToAnalyze?: string, fileName?: string) => {
		const text = textToAnalyze || contractText
		const name = fileName || file?.name || 'טקסט ידני'

		if (!text.trim()) {
			toast({
				title: 'שגיאה',
				description: 'נא להעלות קובץ או להזין טקסט חוזה',
				variant: 'destructive',
			})
			return
		}

		if (!textToAnalyze) {
			setIsProcessing(true)
			setProcessingProgress(0)
		}

		try {
			setProcessingStage('Contract Analyst with OpenAi...')
			setProcessingProgress(70)

			const response = await fetch('http://localhost:3000/api/ai/analyze-contract', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contractText: text,
					fileName: name,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to analyze contract')
			}

			const result = await response.json()
			const analysis = result.analysis

			setContractAnalysis(analysis)
			setProcessingProgress(90)

			// מילוי אוטומטי של הטופס
			setProcessingStage('ממלא טופס אוטומטית...')
			setFormData((prev) => ({
				...prev,
				name: analysis.contractName || prev.name,
				client_name: analysis.partyB?.name || prev.client_name,
				contract_type: analysis.contractType || prev.contract_type,
				start_date: analysis.startDate || prev.start_date,
				end_date: analysis.endDate || prev.end_date,
				total_value: analysis.value || prev.total_value,
				description: analysis.description || prev.description,
			}))

			setProcessingProgress(100)

			toast({
				title: 'ניתוח הושלם! 🎉',
				description: `זוהו ${analysis.obligations?.length || 0} התחייבויות ו-${analysis.riskFactors?.length || 0} סיכונים`,
				className: 'bg-gradient-to-l from-blue-600 to-purple-600 text-white border-none',
			})
		} catch (error) {
			console.error('Error analyzing contract:', error)
			toast({
				title: 'שגיאה בניתוח AI',
				description: 'נסה שוב או מלא את הטופס ידנית',
				variant: 'destructive',
			})
		} finally {
			if (!textToAnalyze) {
				setIsProcessing(false)
				setProcessingProgress(0)
				setProcessingStage('')
			}
		}
	}

	function normalizePriority(p?: unknown): TaskPriority | null {
		if (!p) return null
		const v = String(p).trim().toLowerCase()
		if (['high', 'גבוהה', 'высокая'].includes(v)) return 'high'
		if (['medium', 'בינונית', 'средняя'].includes(v)) return 'medium'
		if (['low', 'נמוכה', 'низкая'].includes(v)) return 'low'
		return null
	}
	function toIsoOrUndefined(x?: string | null) {
		if (!x) return undefined
		const d = new Date(x)
		return isNaN(+d) ? undefined : d.toISOString() // полный RFC3339
	}

	// function mapAnalysisToTasks(analysis: any): TaskFromAnalysisDto[] {
	// 	const list = Array.isArray(analysis?.obligations) ? analysis.obligations : []
	//
	// 	return list.map((ob: any, i: number) => {
	// 		const pr = normalizePriority(ob?.priority) ?? 'medium'
	// 		return {
	// 			title: (ob?.title || ob?.description || `Task #${i + 1}`).toString().slice(0, 255),
	// 			description:
	// 				[
	// 					ob?.description ? String(ob.description) : '',
	// 					ob?.responsibleParty ? `Responsible: ${ob.responsibleParty}` : '',
	// 				]
	// 					.filter(Boolean)
	// 					.join('\n') || undefined,
	// 			dueDate: toIsoOrUndefined(ob?.dueDate),
	// 			clientKey: ob?.id ? String(ob.id) : `auto-${i + 1}`,
	// 			parentClientKey: undefined,
	// 			priority: pr,
	// 			// approval_required не заполняем, чтобы не триггерить валидатор assigneeIds
	// 		}
	// 	})
	// }

	function mapAnalysisToTasks(analysis: any): TaskFromAnalysisDto[] {
		const list = Array.isArray(analysis?.obligations) ? analysis.obligations : []
		return list.map((ob: any, i: number) => {
			const pr = normalizePriority(ob?.priority) ?? 'medium'
			const rpKey = normActorKey(ob?.responsibleParty)
			const matched = actorOptions.find((label) => normActorKey(label) === rpKey)
			const user = matched ? actorMap[matched] : null

			return {
				title: (ob?.title || ob?.description || `Task #${i + 1}`).toString().slice(0, 255),
				description:
					[
						ob?.description ? String(ob.description) : '',
						ob?.responsibleParty ? `Responsible: ${ob.responsibleParty}` : '',
					]
						.filter(Boolean)
						.join('\n') || undefined,
				dueDate: toIsoOrUndefined(ob?.dueDate),
				clientKey: ob?.id ? String(ob.id) : `auto-${i + 1}`,
				parentClientKey: undefined,
				priority: pr,
				assigneeIds: user?.id ? [Number(user.id)] : undefined,
			}
		})
	}

	const mapAnalysisToRisks = (analysis: any, contractId: number) => {
		const list = Array.isArray(analysis?.riskFactors) ? analysis.riskFactors : []
		return list
			.map((text: any) => String(text || '').trim())
			.filter(Boolean)
			.map((title: string) => ({ title, contractId }))
	}

	const handleSubmit = async () => {
		if (!formData.name || !formData.client_name || !formData.contract_type) {
			toast({
				title: 'שגיאה בטופס',
				description: 'נא למלא את כל השדות הנדרשים',
				variant: 'destructive',
			})
			return
		}

		setIsSubmitting(true)

		try {
			console.log('[v0] Starting contract save process...')

			const contractData = {
				name: formData.name,
				client_name: formData.client_name,
				client_email: formData.client_email,
				client_phone: formData.client_phone,
				client_id: formData.client_phone || null,
				signing_date: formData.start_date || new Date().toISOString().split('T')[0],
				contract_type: formData.contract_type,
				value: formData.total_value || null,
				file_url: null,
			}

			console.log('[v0] Creating contract with data:', contractData)

			let savedContract
			try {
				//savedContract = await createContract(contractData)
				// console.log('[v0] Contract saved successfully:', savedContract)
			} catch (contractError) {
				console.error('[v0] Contract creation failed:', contractError)
				throw new Error(`Failed to create contract: ${contractError.message}`)
			}

			// if (contractAnalysis?.obligations && contractAnalysis.obligations.length > 0) {
			// 	console.log('[v0] Saving', contractAnalysis.obligations.length, 'obligations...')
			//
			// 	for (const obligation of contractAnalysis.obligations) {
			// 		const obligationData = {
			// 			contract_id: savedContract.id,
			// 			description: obligation.description,
			// 			responsible_party: obligation.responsibleParty,
			// 			due_date: obligation.dueDate,
			// 			priority: obligation.priority,
			// 			category: obligation.category,
			// 			requires_proof: obligation.requiresProof,
			// 			amount: obligation.amount || null,
			// 			ai_generated: true,
			// 		}
			//
			// 		try {
			// 			console.log('[v0] Creating obligation:', obligationData)
			// 			await createObligation(obligationData)
			// 		} catch (obligationError) {
			// 			console.error('[v0] Failed to create obligation:', obligationError)
			// 			// Continue with other obligations even if one fails
			// 		}
			// 	}
			//
			// 	console.log('[v0] All obligations processed!')
			// }

			const obligationCount = contractAnalysis?.obligations?.length || 0
			toast({
				title: 'חוזה נשמר בהצלחה! 🎉',
				description: `החוזה נשמר עם ${obligationCount} התחייבויות במסד הנתונים`,
				className: 'bg-gradient-to-l from-green-600 to-emerald-600 text-white border-none',
			})

			let documentId: number | undefined = undefined
			if (file) {
				const uploaded = await uploadDocument({
					file,
					originalName: formData.name,
				}).unwrap()
				documentId = Number(uploaded?.id)
			}

			const tasks = contractAnalysis ? mapAnalysisToTasks(contractAnalysis) : []

			const payload = {
				title: formData.name,
				description: formData.description || (contractAnalysis?.description ?? null),
				status: 'active' as const,
				clientId: null,
				dueDate: toIsoOrUndefined(formData.end_date || contractAnalysis?.endDate) ?? null,
				tasks,
				documentId,
			}

			const created = await materializeContract(payload).unwrap()

			const contractId: number = Number(created?.contract?.id) || Number(created?.id) || 0

			if (contractAnalysis && contractId > 0) {
				const risksPayload = mapAnalysisToRisks(contractAnalysis, contractId)
				if (risksPayload.length > 0) {
					await createRisk(risksPayload).unwrap()
				}
			}
			// onSave({
			// 	name: formData.name,
			// 	clientName: formData.client_name,
			// 	clientEmail: formData.client_email,
			// 	clientPhone: formData.client_phone,
			// 	signingDate: formData.start_date,
			// 	contractType: formData.contract_type,
			// 	value: formData.total_value,
			// 	file: file,
			// 	contractAnalysis: contractAnalysis,
			// 	processedFile: processedFile,
			// 	contractText: contractText,
			// 	savedContract: savedContract,
			// })

			setFormData({
				name: '',
				client_name: '',
				client_email: '',
				client_phone: '',
				contract_type: '',
				start_date: '',
				end_date: '',
				total_value: '',
				description: '',
				status: 'active',
			})
			setFile(null)
			setProcessedFile(null)
			setContractText('')
			setContractAnalysis(null)
		} catch (error) {
			console.error('[v0] Error saving contract:', error)
			toast({
				title: 'שגיאה בשמירת החוזה',
				description: `${error.message || 'שגיאה לא ידועה'} - בדוק את החיבור למסד הנתונים`,
				variant: 'destructive',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const getPriorityColor = (p: Priority) => {
		switch (p) {
			case 'high':
				return 'bg-red-100 text-red-800 border-red-200'
			case 'medium':
				return 'bg-amber-100 text-amber-800 border-amber-200'
			case 'low':
				return 'bg-green-100 text-green-800 border-green-200'
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
						<Plus className='h-6 w-6 text-blue-600' />
						הוספת חוזה חדש - LAWCOPILOT AI
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* File Processing Section */}
					<Card className='bg-gradient-to-l from-blue-50 to-purple-50 border-blue-200'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-blue-800'>
								<Brain className='h-5 w-5' />
								OpenAi
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div
								className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors
                  ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}
                `}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}
							>
								<Upload className='h-8 w-8 text-slate-400 mx-auto mb-3' />
								<div className='space-y-2'>
									<p className='font-medium text-slate-700'>
										העלה חוזה לעיבוד אוטומטי מלא
									</p>
									<p className='text-sm text-slate-500'>
										PDF, Word, RTF או טקסט - המערכת תחלץ ותנתח הכל
									</p>
									<input
										type='file'
										className='hidden'
										id='contract-upload'
										accept='.pdf,.doc,.docx,.txt,.rtf'
										onChange={(e) =>
											e.target.files?.[0] &&
											handleFileSelect(e.target.files[0])
										}
									/>
									<Button
										variant='outline'
										onClick={() =>
											document.getElementById('contract-upload')?.click()
										}
										className='mt-2'
									>
										<Upload className='ml-2 h-4 w-4' />
										בחר קובץ
									</Button>
								</div>
							</div>

							{/* Alternative: Manual text input */}
							<div className='space-y-2'>
								<Label htmlFor='contract-text'>או הזן טקסט חוזה ידנית</Label>
								<Textarea
									id='contract-text'
									placeholder='הדבק כאן את טקסט החוזה המלא לניתוח...'
									value={contractText}
									onChange={(e) => setContractText(e.target.value)}
									rows={6}
									className='resize-none'
								/>
								{contractText.trim() && !file && (
									<Button
										onClick={() => analyzeContractWithAI()}
										disabled={isProcessing}
										className='bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
									>
										{isProcessing ? (
											<>
												<Loader2 className='ml-2 h-4 w-4 animate-spin' />
												מנתח...
											</>
										) : (
											<>
												<Sparkles className='ml-2 h-4 w-4' />
												נתח טקסט עם AI
											</>
										)}
									</Button>
								)}
							</div>

							{/* File Processing Status */}
							{file && (
								<div className='space-y-3'>
									<div className='flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
										<FileText className='h-5 w-5 text-green-600' />
										<div className='flex-1'>
											<p className='font-medium text-green-800'>
												{file.name}
											</p>
											<p className='text-sm text-green-600'>
												{(file.size / 1024 / 1024).toFixed(2)} MB
												{processedFile &&
													` • ${processedFile.metadata.wordCount} מילים • ${processedFile.chunks.length} קטעים`}
											</p>
										</div>
										<Button
											variant='ghost'
											size='sm'
											onClick={() => {
												setFile(null)
												setProcessedFile(null)
												setContractText('')
												setContractAnalysis(null)
											}}
											className='text-green-600 hover:text-green-700'
										>
											<X className='h-4 w-4' />
										</Button>
									</div>
								</div>
							)}

							{/* Processing Progress */}
							{isProcessing && (
								<div className='space-y-3'>
									<div className='flex items-center gap-2'>
										<Loader2 className='h-4 w-4 animate-spin text-blue-600' />
										<span className='text-sm font-medium'>
											{processingStage}
										</span>
									</div>
									<Progress value={processingProgress} className='w-full' />
								</div>
							)}
						</CardContent>
					</Card>

					{/* Contract Analysis Results */}
					{contractAnalysis && (
						<Card className='bg-green-50 border-green-200'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2 text-green-800'>
									<CheckCircle2 className='h-5 w-5' />
									תוצאות ניתוח החוזה
									<Button
										onClick={() => setManualObligationModalOpen(true)}
										variant='outline'
										size='sm'
										className='mr-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
									>
										<Plus className='ml-2 h-4 w-4' />
										הוסף התחייבות ידנית
									</Button>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								{/* Contract Overview */}
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='bg-white p-4 rounded-lg border border-green-200'>
										<h4 className='font-semibold text-slate-800 mb-2'>
											פרטי החוזה
										</h4>
										<div className='space-y-2 text-sm'>
											<div>
												<span className='text-slate-600'>שם:</span>{' '}
												<span className='font-medium'>
													{contractAnalysis.contractName}
												</span>
											</div>
											<div>
												<span className='text-slate-600'>סוג:</span>{' '}
												<span className='font-medium'>
													{contractAnalysis.contractType}
												</span>
											</div>
											{contractAnalysis.value && (
												<div>
													<span className='text-slate-600'>ערך:</span>{' '}
													<span className='font-medium'>
														{contractAnalysis.value}
													</span>
												</div>
											)}
											{contractAnalysis.startDate && (
												<div>
													<span className='text-slate-600'>התחלה:</span>{' '}
													<span className='font-medium'>
														{new Date(
															contractAnalysis.startDate
														).toLocaleDateString('he-IL')}
													</span>
												</div>
											)}
											{contractAnalysis.endDate && (
												<div>
													<span className='text-slate-600'>סיום:</span>{' '}
													<span className='font-medium'>
														{new Date(
															contractAnalysis.endDate
														).toLocaleDateString('he-IL')}
													</span>
												</div>
											)}
										</div>
									</div>

									<div className='bg-white p-4 rounded-lg border border-green-200'>
										<h4 className='font-semibold text-slate-800 mb-2'>
											צדדים לחוזה
										</h4>
										<div className='space-y-3 text-sm'>
											<div>
												<div className='font-medium text-blue-700'>
													{contractAnalysis.partyA.name}
												</div>
												<div className='text-slate-600'>
													{contractAnalysis.partyA.role}
												</div>
												{contractAnalysis.partyA.idNumber && (
													<div className='text-xs text-slate-500'>
														{contractAnalysis.partyA.idNumber}
													</div>
												)}
											</div>
											<div>
												<div className='font-medium text-purple-700'>
													{contractAnalysis.partyB.name}
												</div>
												<div className='text-slate-600'>
													{contractAnalysis.partyB.role}
												</div>
												{contractAnalysis.partyB.idNumber && (
													<div className='text-xs text-slate-500'>
														{contractAnalysis.partyB.idNumber}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

								{/* Obligations Preview */}
								{obligations && obligations.length > 0 && (
									<div className='bg-white p-4 rounded-lg border border-green-200'>
										<h4 className='font-semibold text-slate-800 mb-3 flex items-center gap-2'>
											<Target className='h-4 w-4 text-amber-600' />
											{t('obligation.obligationsTitle')} ({obligations.length}
											)
										</h4>

										<div className='space-y-2 max-h-60 overflow-y-auto'>
											{obligations.map((obligation, index) => {
												const isEditing = editingKey === obligation._key
												const p: Priority = obligation.priority as any
												const currentLabel = actorOptions.find(
													(x) =>
														normActorKey(x) ===
														normActorKey(obligation.responsibleParty)
												)

												return (
													<div
														key={obligation._key ?? index}
														className='bg-slate-50 p-3 rounded border'
													>
														{!isEditing ? (
															<>
																<div className='flex items-start justify-between mb-2'>
																	<div className='space-y-1'>
																		{/* Title */}
																		<div className='font-medium text-slate-800 text-sm'>
																			{obligation.title}
																		</div>
																		{/* Description */}
																		{obligation.description && (
																			<div className='text-xs text-slate-600'>
																				{
																					obligation.description
																				}
																			</div>
																		)}
																	</div>

																	<div className='flex items-center gap-2'>
																		<Badge
																			className={getPriorityColor(
																				p
																			)}
																		>
																			{priorityLabel(p, t)}
																		</Badge>
																		<Button
																			onClick={() =>
																				startEdit(
																					obligation._key
																				)
																			}
																			variant='outline'
																			size='sm'
																			className='p-1 h-8 w-8'
																			title={t(
																				'obligation.edit'
																			)}
																		>
																			<Pencil className='h-4 w-4' />
																		</Button>
																		<Button
																			onClick={() =>
																				deleteObligation(
																					obligation._key
																				)
																			}
																			variant='outline'
																			size='sm'
																			className='p-1 h-8 w-8 text-red-600 border-red-300 hover:bg-red-50'
																			title={t(
																				'obligation.delete'
																			)}
																		>
																			<Trash2 className='h-4 w-4' />
																		</Button>
																	</div>
																</div>

																{/* Meta row (без category/amount) */}
																<div className='grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600'>
																	<div>
																		<span className='text-slate-500'>
																			{t(
																				'obligation.dueDate'
																			)}
																			:
																		</span>{' '}
																		{fmtDate(
																			obligation.dueDate
																		)}
																	</div>
																	<div>
																		<span className='text-slate-500'>
																			{t(
																				'obligation.responsible'
																			)}
																			:
																		</span>{' '}
																		{obligation.responsibleParty ||
																			'—'}
																	</div>
																	<div>
																		<span className='text-slate-500'>
																			{t(
																				'obligation.requiresProof'
																			)}
																			:
																		</span>{' '}
																		{obligation.requiresProof
																			? t('yes')
																			: t('no')}
																	</div>
																</div>
															</>
														) : (
															<div className='space-y-3'>
																{/* Title + actions */}
																<div className='flex items-start justify-between gap-2'>
																	<input
																		value={
																			obligation.title || ''
																		}
																		onChange={(e) =>
																			updateObligation(
																				obligation._key,
																				{
																					title: e.target
																						.value,
																				}
																			)
																		}
																		className='w-full text-sm border rounded p-2'
																		placeholder={
																			t('obligation.title') ||
																			'Title'
																		}
																	/>
																	<div className='flex items-center gap-2'>
																		<Button
																			onClick={() =>
																				saveObligation(
																					obligation._key
																				)
																			}
																			variant='outline'
																			size='sm'
																			className='p-1 h-8 w-8 text-green-700 border-green-300 hover:bg-green-50'
																			title={t(
																				'obligation.save'
																			)}
																		>
																			<Save className='h-4 w-4' />
																		</Button>
																		<Button
																			onClick={cancelEdit}
																			variant='outline'
																			size='sm'
																			className='p-1 h-8 w-8'
																			title={t(
																				'obligation.cancel'
																			)}
																		>
																			<X className='h-4 w-4' />
																		</Button>
																	</div>
																</div>

																{/* Description */}
																<textarea
																	value={
																		obligation.description || ''
																	}
																	onChange={(e) =>
																		updateObligation(
																			obligation._key,
																			{
																				description:
																					e.target.value,
																			}
																		)
																	}
																	rows={3}
																	className='w-full text-sm border rounded p-2'
																	placeholder={
																		t(
																			'obligation.description'
																		) || 'Description'
																	}
																/>

																<div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
																	{/* Priority */}
																	<div className='flex flex-col gap-1'>
																		<label className='text-xs text-slate-500'>
																			{t(
																				'obligation.priority'
																			)}
																		</label>
																		<select
																			value={
																				obligation.priority ||
																				''
																			}
																			onChange={(e) =>
																				updateObligation(
																					obligation._key,
																					{
																						priority: (e
																							.target
																							.value ||
																							null) as Priority,
																					}
																				)
																			}
																			className='border rounded p-2 text-sm bg-white'
																		>
																			<option value=''>
																				{'—'}
																			</option>
																			<option value='low'>
																				{t(
																					'tasks.priority.low'
																				) || 'Low'}
																			</option>
																			<option value='medium'>
																				{t(
																					'tasks.priority.medium'
																				) || 'Medium'}
																			</option>
																			<option value='high'>
																				{t(
																					'tasks.priority.high'
																				) || 'High'}
																			</option>
																		</select>
																	</div>

																	{/* Due date */}
																	<div className='flex flex-col gap-1'>
																		<label className='text-xs text-slate-500'>
																			{t(
																				'obligation.dueDate'
																			)}
																		</label>
																		<input
																			type='date'
																			value={
																				obligation.dueDate
																					? new Date(
																							obligation.dueDate
																						)
																							.toISOString()
																							.slice(
																								0,
																								10
																							)
																					: ''
																			}
																			onChange={(e) =>
																				updateObligation(
																					obligation._key,
																					{
																						dueDate:
																							e.target
																								.value ||
																							null,
																					}
																				)
																			}
																			className='border rounded p-2 text-sm'
																		/>
																	</div>

																	{/* Responsible */}
																	<div className='flex flex-col gap-1'>
																		<label className='text-xs text-slate-500'>
																			{t(
																				'obligation.responsible'
																			)}
																		</label>
																		<Select
																			// undefined => показывается <SelectValue placeholder='—' />
																			value={
																				currentLabel ??
																				undefined
																			}
																			onValueChange={(
																				value
																			) => {
																				if (
																					value ===
																					'__clear__'
																				) {
																					updateObligation(
																						obligation._key,
																						{
																							responsibleParty:
																								null,
																						}
																					)
																				} else {
																					updateObligation(
																						obligation._key,
																						{
																							responsibleParty:
																								value,
																						}
																					)
																				}
																			}}
																		>
																			<SelectTrigger className='border rounded p-2 text-sm bg-white'>
																				<SelectValue placeholder='—' />
																			</SelectTrigger>
																			<SelectContent>
																				{actorOptions.map(
																					(opt) => (
																						<SelectItem
																							key={
																								opt
																							}
																							value={
																								opt
																							}
																						>
																							{opt}
																						</SelectItem>
																					)
																				)}

																				{/* опционально: пункт для очистки */}
																				<SelectItem value='__clear__'>
																					Очистить выбор
																				</SelectItem>
																			</SelectContent>
																		</Select>
																	</div>

																	{/* Requires proof */}
																	<div className='flex flex-col gap-1'>
																		<label className='text-xs text-slate-500'>
																			{t(
																				'obligation.requiresProof'
																			)}
																		</label>
																		<div className='flex items-center gap-2 text-sm'>
																			<input
																				id={`requires-${obligation._key}`}
																				type='checkbox'
																				checked={Boolean(
																					obligation.requiresProof
																				)}
																				onChange={(e) =>
																					updateObligation(
																						obligation._key,
																						{
																							requiresProof:
																								e
																									.target
																									.checked,
																						}
																					)
																				}
																			/>
																			<label
																				htmlFor={`requires-${obligation._key}`}
																				className='text-slate-700'
																			>
																				{obligation.requiresProof
																					? t('yes')
																					: t('no')}
																			</label>
																		</div>
																	</div>
																</div>
															</div>
														)}
													</div>
												)
											})}
										</div>
									</div>
								)}

								{contractAnalysis && (
									<ContractRisksEditor
										risks={contractAnalysis.riskFactors || []}
										onChange={(next) =>
											setContractAnalysis((prev) =>
												prev ? { ...prev, riskFactors: next } : prev
											)
										}
									/>
								)}

								<div className='bg-white p-4 rounded-lg border border-green-200'>
									<h4 className='font-semibold text-slate-800 mb-3'>
										Связать участников (responsibleParty → пользователь)
									</h4>

									<div className='mb-3'>
										<AddActorInline onAdd={addCustomActor} />
									</div>

									{/* Чипы созданных вручную персон с удалением */}
									{customActors.length > 0 && (
										<div className='flex flex-wrap gap-2 mb-3'>
											{customActors.map((c) => (
												<span
													key={c}
													className='inline-flex items-center gap-2 text-sm px-2 py-1 border rounded bg-slate-50'
												>
													{c}
													<button
														type='button'
														className='text-slate-500 hover:text-red-600'
														onClick={() => removeCustomActor(c)}
														title='Удалить'
													>
														×
													</button>
												</span>
											))}
										</div>
									)}

									{actorOptions.length === 0 ? (
										<p className='text-sm text-slate-600'>
											В обязанностях не найдено ролей для сопоставления.
										</p>
									) : (
										<div className='space-y-3'>
											{actorOptions.map((key) => (
												<div
													key={key}
													className='grid grid-cols-1 md:grid-cols-3 gap-2 items-center'
												>
													<div className='text-sm font-medium text-slate-700'>
														{key}
													</div>
													<div className='md:col-span-2'>
														<UserSearchSelect
															value={actorMap[key] ?? null}
															onChange={(u) =>
																setActorMap((prev) => ({
																	...prev,
																	[key]: u,
																}))
															}
															placeholder='Найти по email или имени…'
														/>
													</div>
												</div>
											))}
										</div>
									)}

									<p className='text-xs text-slate-500 mt-2'>
										Маппинг применяется при сохранении: если responsibleParty
										совпадает с ключом, добавим assigneeIds.
									</p>
								</div>

								{/*/!* Risk Factors *!/*/}
								{/*{contractAnalysis.riskFactors &&*/}
								{/*	contractAnalysis.riskFactors.length > 0 && (*/}
								{/*		<div className='bg-red-50 p-4 rounded-lg border border-red-200'>*/}
								{/*			<h4 className='font-semibold text-red-800 mb-2 flex items-center gap-2'>*/}
								{/*				<AlertTriangle className='h-4 w-4' />*/}
								{/*				סיכונים שזוהו ({contractAnalysis.riskFactors.length}*/}
								{/*				)*/}
								{/*			</h4>*/}
								{/*			<ul className='space-y-1 text-sm'>*/}
								{/*				{contractAnalysis.riskFactors*/}
								{/*					.slice(0, 3)*/}
								{/*					.map((risk, index) => (*/}
								{/*						<li*/}
								{/*							key={index}*/}
								{/*							className='text-red-700 flex items-start gap-2'*/}
								{/*						>*/}
								{/*							<span className='text-red-500 mt-1'>*/}
								{/*								•*/}
								{/*							</span>*/}
								{/*							{risk}*/}
								{/*						</li>*/}
								{/*					))}*/}
								{/*			</ul>*/}
								{/*		</div>*/}
								{/*	)}*/}

								<p className='text-sm text-green-700'>
									💡 כל המידע ימולא אוטומטית בטופס ויתווסף לחוזה
								</p>
							</CardContent>
						</Card>
					)}

					{/* Contract Form */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<div>
								<Label htmlFor='name' className='flex items-center gap-2'>
									<FileText className='h-4 w-4 text-blue-600' />
									שם החוזה *
								</Label>
								<Input
									id='name'
									placeholder='הזן שם החוזה'
									value={formData.name}
									onChange={(e) => handleInputChange('name', e.target.value)}
									className={
										contractAnalysis ? 'border-green-300 bg-green-50' : ''
									}
								/>
							</div>

							<div>
								<Label htmlFor='client_name' className='flex items-center gap-2'>
									<Building2 className='h-4 w-4 text-green-600' />
									שם הלקוח *
								</Label>
								<Input
									id='client_name'
									placeholder='הזן שם הלקוח'
									value={formData.client_name}
									onChange={(e) =>
										handleInputChange('client_name', e.target.value)
									}
									className={
										contractAnalysis ? 'border-green-300 bg-green-50' : ''
									}
								/>
							</div>

							<div>
								<Label htmlFor='client_email'>אימייל לקוח</Label>
								<Input
									id='client_email'
									type='email'
									placeholder='client@example.com'
									value={formData.client_email}
									onChange={(e) =>
										handleInputChange('client_email', e.target.value)
									}
								/>
							</div>

							<div>
								<Label htmlFor='client_phone'>טלפון לקוח</Label>
								<Input
									id='client_phone'
									placeholder='050-1234567'
									value={formData.client_phone}
									onChange={(e) =>
										handleInputChange('client_phone', e.target.value)
									}
								/>
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<Label htmlFor='contract_type' className='flex items-center gap-2'>
									<Users className='h-4 w-4 text-purple-600' />
									סוג החוזה *
								</Label>
								<Select
									value={formData.contract_type}
									onValueChange={(value) =>
										handleInputChange('contract_type', value)
									}
								>
									<SelectTrigger
										className={
											contractAnalysis ? 'border-green-300 bg-green-50' : ''
										}
									>
										<SelectValue placeholder='בחר סוג חוזה' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='שירותים'>שירותים</SelectItem>
										<SelectItem value='אספקה'>אספקה</SelectItem>
										<SelectItem value='נדלן'>נדלן</SelectItem>
										<SelectItem value='עבודה'>עבודה</SelectItem>
										<SelectItem value='שותפות'>שותפות</SelectItem>
										<SelectItem value='רישוי'>רישוי</SelectItem>
										<SelectItem value='אחר'>אחר</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor='start_date' className='flex items-center gap-2'>
									<Calendar className='h-4 w-4 text-blue-600' />
									תאריך התחלה
								</Label>
								<Input
									id='start_date'
									type='date'
									value={formData.start_date}
									onChange={(e) =>
										handleInputChange('start_date', e.target.value)
									}
									className={
										contractAnalysis ? 'border-green-300 bg-green-50' : ''
									}
								/>
							</div>

							<div>
								<Label htmlFor='end_date' className='flex items-center gap-2'>
									<Calendar className='h-4 w-4 text-red-600' />
									תאריך סיום
								</Label>
								<Input
									id='end_date'
									type='date'
									value={formData.end_date}
									onChange={(e) => handleInputChange('end_date', e.target.value)}
									className={
										contractAnalysis ? 'border-green-300 bg-green-50' : ''
									}
								/>
							</div>

							<div>
								<Label htmlFor='total_value' className='flex items-center gap-2'>
									<DollarSign className='h-4 w-4 text-amber-600' />
									ערך החוזה (ש״ח)
								</Label>
								<Input
									id='total_value'
									type='number'
									placeholder='0'
									value={formData.total_value}
									onChange={(e) =>
										handleInputChange('total_value', e.target.value)
									}
									className={
										contractAnalysis ? 'border-green-300 bg-green-50' : ''
									}
								/>
							</div>
						</div>
					</div>

					<div>
						<Label htmlFor='description'>תיאור החוזה</Label>
						<Textarea
							id='description'
							placeholder='תיאור קצר של החוזה...'
							value={formData.description}
							onChange={(e) => handleInputChange('description', e.target.value)}
							rows={3}
							className={contractAnalysis ? 'border-green-300 bg-green-50' : ''}
						/>
					</div>

					{/* Action Buttons */}
					<div className='flex justify-end gap-3 pt-4 border-t'>
						<Button variant='outline' onClick={onClose} disabled={isSubmitting}>
							ביטול
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className='bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
						>
							{isSubmitting ? (
								<>
									<Loader2 className='ml-2 h-4 w-4 animate-spin' />
									שומר חוזה...
								</>
							) : (
								<>
									<CheckCircle2 className='ml-2 h-4 w-4' />
									שמור חוזה עם ניתוח AI
								</>
							)}
						</Button>
					</div>
				</div>

				{/* Manual Obligation Modal */}
				{/*<ManualObligationModal*/}
				{/*	isOpen={isManualObligationModalOpen}*/}
				{/*	onClose={() => setManualObligationModalOpen(false)}*/}
				{/*	onSave={(obligationData) => {*/}
				{/*		console.log('New manual obligation:', obligationData)*/}
				{/*		setManualObligationModalOpen(false)*/}
				{/*		toast({*/}
				{/*			title: 'התחייבות נוספה!',*/}
				{/*			description: 'ההתחייבות הידנית נוספה בהצלחה',*/}
				{/*			className: 'bg-green-500 text-white',*/}
				{/*		})*/}
				{/*	}}*/}
				{/*	contractId={null}*/}
				{/*/>*/}

				<ManualObligationModal
					isOpen={isManualObligationModalOpen}
					onClose={() => setManualObligationModalOpen(false)}
					locale='en'
					onAdd={(ob) => {
						setObligations((prev) => [...prev, ob])
						setContractAnalysis((prev) =>
							prev
								? { ...prev, obligations: [...(prev.obligations || []), ob] }
								: prev
						)
					}}
				/>

				{/* Obligation Timer Modal */}
				{/*<ObligationTimerModal*/}
				{/*	isOpen={isTimerModalOpen}*/}
				{/*	onClose={() => setTimerModalOpen(false)}*/}
				{/*	obligation={selectedObligation}*/}
				{/*	clientEmail={formData.client_email}*/}
				{/*/>*/}
			</DialogContent>
		</Dialog>
	)
}
