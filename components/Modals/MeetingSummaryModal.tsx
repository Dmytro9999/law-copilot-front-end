'use client'

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
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Brain, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface MeetingSummaryModalProps {
	isOpen: boolean
	onClose: () => void
	onSaveSummary: (summaryData: any) => void
	contracts: any[]
}

export default function MeetingSummaryModal({
	isOpen,
	onClose,
	onSaveSummary,
	contracts,
}: MeetingSummaryModalProps) {
	const [formData, setFormData] = useState({
		contractId: '',
		meetingDate: '',
		participants: '',
		summary: '',
	})
	const [isProcessing, setIsProcessing] = useState(false)
	const [aiSummary, setAiSummary] = useState(null)
	const { toast } = useToast()

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const generateAISummary = async () => {
		if (!formData.summary.trim()) {
			toast({
				title: 'שגיאה',
				description: 'נא להזין רשימות פגישה לפני יצירת סיכום AI',
				variant: 'destructive',
			})
			return
		}

		setIsProcessing(true)
		try {
			const selectedContract = contracts.find(
				(c) => c.id === Number.parseInt(formData.contractId)
			)
			const contractContext = selectedContract
				? `חוזה: ${selectedContract.name}, לקוח: ${selectedContract.client_name}, סוג: ${selectedContract.contract_type}`
				: 'אין הקשר חוזה'

			const response = await fetch('/api/meeting-summary', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					meetingNotes: formData.summary,
					contractContext,
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to generate AI summary')
			}

			const data = await response.json()
			setAiSummary(data.aiSummary)

			toast({
				title: 'סיכום AI נוצר בהצלחה! 🤖',
				description: 'Google Gemini ניתח את הפגישה וזיהה פעולות נדרשות',
				className: 'bg-gradient-to-l from-blue-600 to-purple-600 text-white border-none',
			})
		} catch (error) {
			console.error('Error generating AI summary:', error)
			toast({
				title: 'שגיאה ביצירת סיכום',
				description: 'נסה שוב או צור סיכום ידני',
				variant: 'destructive',
			})
		} finally {
			setIsProcessing(false)
		}
	}

	const handleSave = () => {
		if (!formData.contractId || !formData.meetingDate || !formData.participants) {
			toast({
				title: 'שגיאה בטופס',
				description: 'נא למלא את כל השדות הנדרשים',
				variant: 'destructive',
			})
			return
		}

		const summaryData = {
			...formData,
			contractId: Number.parseInt(formData.contractId),
			participants: formData.participants.split(',').map((p) => p.trim()),
			aiSummary: aiSummary || {
				summary: formData.summary,
				mainTopics: [],
				decisions: [],
				actionItems: [],
				legalRisks: [],
				recommendations: [],
			},
		}

		onSaveSummary(summaryData)
	}

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'גבוהה':
				return 'bg-red-100 text-red-800 border-red-200'
			case 'בינונית':
				return 'bg-amber-100 text-amber-800 border-amber-200'
			case 'נמוכה':
				return 'bg-green-100 text-green-800 border-green-200'
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	const getPriorityIcon = (priority: string) => {
		switch (priority) {
			case 'גבוהה':
				return <AlertTriangle className='h-3 w-3' />
			case 'בינונית':
				return <Clock className='h-3 w-3' />
			case 'נמוכה':
				return <CheckCircle2 className='h-3 w-3' />
			default:
				return <Clock className='h-3 w-3' />
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
						<Brain className='h-6 w-6 text-blue-600' />
						סיכום פגישה חכם - LAWCOPILOT
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Form Section */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label htmlFor='contractId'>חוזה קשור *</Label>
							<Select
								value={formData.contractId}
								onValueChange={(value) => handleInputChange('contractId', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder='בחר חוזה' />
								</SelectTrigger>
								<SelectContent>
									{contracts.map((contract) => (
										<SelectItem
											key={contract.id}
											value={contract.id.toString()}
										>
											{contract.name} - {contract.client_name}
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
							<Label htmlFor='participants'>משתתפים *</Label>
							<Input
								id='participants'
								placeholder='הזן שמות המשתתפים מופרדים בפסיקים'
								value={formData.participants}
								onChange={(e) => handleInputChange('participants', e.target.value)}
							/>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='summary'>רשימות פגישה *</Label>
							<Textarea
								id='summary'
								placeholder='הזן את רשימות הפגישה כאן... Google Gemini ינתח אותן ויצור סיכום מקצועי'
								value={formData.summary}
								onChange={(e) => handleInputChange('summary', e.target.value)}
								rows={6}
								className='resize-none'
							/>
						</div>
					</div>

					{/* AI Analysis Button */}
					<div className='flex justify-center'>
						<Button
							onClick={generateAISummary}
							disabled={isProcessing || !formData.summary.trim()}
							className='bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg'
						>
							{isProcessing ? (
								<>
									<Loader2 className='ml-2 h-5 w-5 animate-spin' />
									Google Gemini מנתח...
								</>
							) : (
								<>
									<Sparkles className='ml-2 h-5 w-5' />
									צור סיכום AI חכם
								</>
							)}
						</Button>
					</div>

					{/* AI Summary Results */}
					{aiSummary && (
						<div className='space-y-4'>
							<div className='flex items-center gap-2 mb-4'>
								<Brain className='h-5 w-5 text-blue-600' />
								<h3 className='text-lg font-bold text-slate-800'>
									תוצאות ניתוח Google Gemini
								</h3>
								<Badge className='bg-green-100 text-green-800 border-green-200'>
									<CheckCircle2 className='h-3 w-3 ml-1' />
									הושלם
								</Badge>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{/* Summary */}
								<Card className='bg-blue-50/50 border-blue-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-blue-800'>
											סיכום כללי
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-slate-700'>
											{aiSummary.summary}
										</p>
									</CardContent>
								</Card>

								{/* Main Topics */}
								<Card className='bg-purple-50/50 border-purple-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-purple-800'>
											נושאים עיקריים
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className='space-y-1'>
											{aiSummary.mainTopics?.map((topic, index) => (
												<li
													key={index}
													className='text-sm text-slate-700 flex items-start gap-2'
												>
													<span className='text-purple-600'>•</span>
													{topic}
												</li>
											))}
										</ul>
									</CardContent>
								</Card>

								{/* Decisions */}
								<Card className='bg-green-50/50 border-green-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-green-800'>
											החלטות
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className='space-y-1'>
											{aiSummary.decisions?.map((decision, index) => (
												<li
													key={index}
													className='text-sm text-slate-700 flex items-start gap-2'
												>
													<CheckCircle2 className='h-3 w-3 text-green-600 mt-0.5 flex-shrink-0' />
													{decision}
												</li>
											))}
										</ul>
									</CardContent>
								</Card>

								{/* Legal Risks */}
								<Card className='bg-red-50/50 border-red-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-red-800'>
											סיכונים משפטיים
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className='space-y-1'>
											{aiSummary.legalRisks?.map((risk, index) => (
												<li
													key={index}
													className='text-sm text-slate-700 flex items-start gap-2'
												>
													<AlertTriangle className='h-3 w-3 text-red-600 mt-0.5 flex-shrink-0' />
													{risk}
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</div>

							{/* Action Items */}
							{aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
								<Card className='bg-amber-50/50 border-amber-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-amber-800'>
											פעולות נדרשות ({aiSummary.actionItems.length})
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='space-y-3'>
											{aiSummary.actionItems.map((item, index) => (
												<div
													key={index}
													className='bg-white p-3 rounded-lg border border-amber-200'
												>
													<div className='flex items-start justify-between mb-2'>
														<h4 className='font-medium text-slate-800'>
															{item.description}
														</h4>
														<Badge
															className={getPriorityColor(
																item.priority
															)}
														>
															{getPriorityIcon(item.priority)}
															{item.priority}
														</Badge>
													</div>
													<div className='grid grid-cols-2 gap-2 text-xs text-slate-600'>
														<div>
															<span className='font-medium'>
																אחראי:
															</span>{' '}
															{item.responsibleParty}
														</div>
														<div>
															<span className='font-medium'>
																תאריך יעד:
															</span>{' '}
															{new Date(
																item.dueDate
															).toLocaleDateString('he-IL')}
														</div>
														<div>
															<span className='font-medium'>
																קטגוריה:
															</span>{' '}
															{item.category}
														</div>
														<div>
															<span className='font-medium'>
																הוכחת ביצוע:
															</span>{' '}
															{item.requiresProof
																? 'נדרש'
																: 'לא נדרש'}
														</div>
													</div>
													{item.amount && (
														<div className='mt-2 text-xs text-slate-600'>
															<span className='font-medium'>
																סכום:
															</span>{' '}
															{item.amount}
														</div>
													)}
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Recommendations */}
							{aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
								<Card className='bg-indigo-50/50 border-indigo-200'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-semibold text-indigo-800'>
											המליצות
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className='space-y-1'>
											{aiSummary.recommendations.map(
												(recommendation, index) => (
													<li
														key={index}
														className='text-sm text-slate-700 flex items-start gap-2'
													>
														<Sparkles className='h-3 w-3 text-indigo-600 mt-0.5 flex-shrink-0' />
														{recommendation}
													</li>
												)
											)}
										</ul>
									</CardContent>
								</Card>
							)}
						</div>
					)}

					{/* Action Buttons */}
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
