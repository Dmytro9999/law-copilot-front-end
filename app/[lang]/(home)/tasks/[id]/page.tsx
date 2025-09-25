'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
	Calendar,
	CheckCircle2,
	Clock,
	AlertCircle,
	ChevronRight,
	User,
	FileText,
	ArrowLeft,
	CheckCircle,
	XCircle,
	ExternalLink,
} from 'lucide-react'
import { useI18n, useLocale } from '@/providers/I18nProvider'
import { toast } from 'sonner'
import EvidenceSubmitForm from '@/components/task-evidences/EvidenceSubmitForm'
import { useGetTaskByIdQuery } from '@/store/features/tasks/tasksApi'
import {
	useApproveEvidenceMutation,
	useRejectEvidenceMutation,
} from '@/store/features/task-evidences/taskEvidencesApi'
import { useParams } from 'next/navigation'
import AddSubtaskModal from '@/components/Modals/AddSubtaskModal'

// ───────────────────────────────────────────────────────────────────────────────
// MOCK: пока используем константу; потом подменишь на реальный API/RTK.
// ───────────────────────────────────────────────────────────────────────────────
const data = {
	id: 3,
	created: '2025-09-23T12:01:04.508Z',
	updated: '2025-09-23T12:01:04.508Z',
	title: 'Подготовить договор с подрядчиком  0000',
	description: 'Черновик + согласование с юристом',
	status: 'todo',
	priority: 2,
	due_at: '2025-10-15T00:00:00.000Z',
	approval_required: true,
	parentTaskId: null,
	contract: {
		id: 1,
		created: '2025-09-22T14:13:09.924Z',
		updated: '2025-09-22T14:13:09.924Z',
		title: 'Договір страхування наземних транспортних засобів «Міні КАСКО»',
		description:
			"חוזה זה עוסק בביטוח רכב מסוג 'מיני קסקו' עבור רכב Audi A3, כולל תנאים והגבלות ספציפיות.",
		status: 'active',
		contractNumber: null,
		effectiveDate: null,
		dueDate: '2026-09-22T00:00:00.000Z',
	},
	createdBy: {
		id: 1,
		created: '2025-09-22T14:10:47.116Z',
		updated: '2025-09-24T08:36:27.476Z',
		name: 'Admin user',
		email: 'admin@gmail.com',
		phone: '38095096345',
		avatar: null,
		clientType: null,
		company: null,
		position: null,
		address: null,
		identificationCode: null,
		businessNumber: null,
		notes: null,
		two_factor_enabled: false,
	},
	parent: null,
	assignees: [
		{
			id: 1,
			created: '2025-09-23T12:01:04.550Z',
			updated: '2025-09-23T12:01:04.550Z',
			user: {
				id: 2,
				created: '2025-09-22T14:10:47.182Z',
				updated: '2025-09-22T14:10:47.182Z',
				name: 'Member user',
				email: 'member@gmail.com',
				phone: '38095096345',
				avatar: null,
				clientType: null,
				company: null,
				position: null,
				address: null,
				identificationCode: null,
				businessNumber: null,
				notes: null,
				two_factor_enabled: false,
			},
		},
	],
	documents: [],
	progressPct: 33,
	evidences: [
		{
			id: 1,
			created: '2025-09-23T21:28:27.942Z',
			updated: '2025-09-23T21:28:27.942Z',
			message: 'ПЕРВЫЙ ДИСПУТ ПОДВТЕРЖДЕНИЕ',
			status: 'submitted',
			submittedBy: { name: 'Admin user' },
			document: {
				id: 1,
				title: 'Договір страхування наземних транспортних засобів «Міні КАСКО»',
				kind: 'file',
				externalUrl: 'https://example.com/file.pdf', // для демо поставил http-ссылку
				extension: '.pdf',
				size: '323189',
			},
		},
		{
			id: 2,
			created: '2025-09-23T21:32:00.998Z',
			updated: '2025-09-23T21:32:00.998Z',
			message: 'ПЕРВЫЙ ДИСПУТ ПОДВТЕРЖДЕНИЕ2222',
			status: 'approved',
			submittedBy: { name: 'Admin user' },
			document: {
				id: 1,
				title: 'Договір страхування наземних транспортних засобів «Міні КАСКО»',
				kind: 'file',
				externalUrl: 'https://example.com/file.pdf',
				extension: '.pdf',
				size: '323189',
			},
		},
		{
			id: 3,
			created: '2025-09-23T21:32:13.092Z',
			updated: '2025-09-23T21:32:13.092Z',
			message: 'ПЕРВЫЙ ДИСПУТ ПОДВТЕРЖДЕНИЕ33333',
			status: 'rejected',
			submittedBy: { name: 'Admin user' },
			document: null,
		},
	],
	children: [
		{
			id: 4,
			created: '2025-09-23T12:03:00.057Z',
			updated: '2025-09-23T21:28:27.974Z',
			title: 'Получить банковскую выписку  11111',
			description: 'Приложить PDF в документы задачи',
			status: 'awaiting_approval',
			priority: 2,
			due_at: '2025-10-05T00:00:00.000Z',
			approval_required: true,
			parentTaskId: 3,
			createdBy: {
				id: 1,
				created: '2025-09-22T14:10:47.116Z',
				updated: '2025-09-24T08:36:27.476Z',
				name: 'Admin user',
				email: 'admin@gmail.com',
				phone: '38095096345',
				avatar: null,
				clientType: null,
				company: null,
				position: null,
				address: null,
				identificationCode: null,
				businessNumber: null,
				notes: null,
				two_factor_enabled: false,
			},
			assignees: [
				{
					id: 2,
					created: '2025-09-23T12:03:00.101Z',
					updated: '2025-09-23T12:03:00.101Z',
					user: {
						id: 2,
						created: '2025-09-22T14:10:47.182Z',
						updated: '2025-09-22T14:10:47.182Z',
						name: 'Member user',
						email: 'member@gmail.com',
						phone: '38095096345',
						avatar: null,
						clientType: null,
						company: null,
						position: null,
						address: null,
						identificationCode: null,
						businessNumber: null,
						notes: null,
						two_factor_enabled: false,
					},
				},
			],
			documents: [],
			progressPct: 0,
		},
		{
			id: 5,
			created: '2025-09-23T12:12:55.099Z',
			updated: '2025-09-23T12:12:55.099Z',
			title: 'Получить банковскую выписку22222',
			description: 'Приложить PDF в документы задачи22222',
			status: 'done',
			priority: 2,
			due_at: '2025-10-05T00:00:00.000Z',
			approval_required: false,
			parentTaskId: 3,
			createdBy: {
				id: 1,
				created: '2025-09-22T14:10:47.116Z',
				updated: '2025-09-24T08:36:27.476Z',
				name: 'Admin user',
				email: 'admin@gmail.com',
				phone: '38095096345',
				avatar: null,
				clientType: null,
				company: null,
				position: null,
				address: null,
				identificationCode: null,
				businessNumber: null,
				notes: null,
				two_factor_enabled: false,
			},
			assignees: [
				{
					id: 3,
					created: '2025-09-23T12:12:55.142Z',
					updated: '2025-09-23T12:12:55.142Z',
					user: {
						id: 2,
						created: '2025-09-22T14:10:47.182Z',
						updated: '2025-09-22T14:10:47.182Z',
						name: 'Member user',
						email: 'member@gmail.com',
						phone: '38095096345',
						avatar: null,
						clientType: null,
						company: null,
						position: null,
						address: null,
						identificationCode: null,
						businessNumber: null,
						notes: null,
						two_factor_enabled: false,
					},
				},
			],
			documents: [],
			progressPct: 100,
		},
	],
} as const

type EvidenceStatus = 'submitted' | 'approved' | 'rejected'

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function fmtDate(iso?: string | null) {
	if (!iso) return '—'
	try {
		return new Date(iso).toLocaleDateString('he-IL')
	} catch {
		return '—'
	}
}

function evidenceMeta(s: EvidenceStatus) {
	switch (s) {
		case 'submitted':
			return {
				labelKey: 'taskView.evidence.submitted',
				fallback: 'Submitted',
				badgeCls: 'bg-slate-100 text-slate-800 border-slate-200',
				cardCls: 'bg-white',
				icon: Clock,
			}
		case 'approved':
			return {
				labelKey: 'taskView.evidence.approved',
				fallback: 'Approved',
				badgeCls: 'bg-green-100 text-green-700 border-green-200',
				cardCls: 'bg-green-50 border-green-200',
				icon: CheckCircle,
			}
		case 'rejected':
			return {
				labelKey: 'taskView.evidence.rejected',
				fallback: 'Rejected',
				badgeCls: 'bg-red-100 text-red-700 border-red-200',
				cardCls: 'bg-red-50 border-red-200',
				icon: XCircle,
			}
	}
}

function statusMeta(s: string) {
	switch (s) {
		case 'todo':
			return {
				labelKey: 'taskView.status.todo',
				fallback: 'To do',
				icon: Clock,
				cls: 'bg-slate-100 text-slate-700 border-slate-200',
			}
		case 'awaiting_approval':
			return {
				labelKey: 'taskView.status.awaiting_approval',
				fallback: 'Awaiting approval',
				icon: AlertCircle,
				cls: 'bg-amber-100 text-amber-800 border-amber-200',
			}
		case 'done':
			return {
				labelKey: 'taskView.status.done',
				fallback: 'Done',
				icon: CheckCircle2,
				cls: 'bg-green-100 text-green-700 border-green-200',
			}
		default:
			return {
				labelKey: 'taskView.status.unknown',
				fallback: s,
				icon: Clock,
				cls: 'bg-slate-100 text-slate-700 border-slate-200',
			}
	}
}

function priorityMeta(n?: string) {
	switch (n) {
		case 'low':
			return {
				labelKey: 'tasks.priority.low',
				fallback: 'Low',
				cls: 'bg-green-100 text-green-700 border-green-200',
			}
		case 'high':
			return {
				labelKey: 'tasks.priority.high',
				fallback: 'High',
				cls: 'bg-orange-100 text-orange-700 border-orange-200',
			}
		case 'medium':
			return {
				labelKey: 'tasks.priority.medium',
				fallback: 'Medium',
				cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',
			}
		default:
			return {
				labelKey: 'tasks.priority.low',
				fallback: 'Low',
				cls: 'bg-green-100 text-green-700 border-green-200',
			}
	}
}

// ───────────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────────
export default function TaskDetailsPage() {
	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'

	const [isSubOpen, setSubOpen] = useState(false)

	const params = useParams<{ id: string }>()
	const idNum = Number(params?.id)
	const { data, isLoading, isError, refetch } = useGetTaskByIdQuery(idNum, { skip: !idNum })

	const [approveEvidence] = useApproveEvidenceMutation()
	const [rejectEvidence] = useRejectEvidenceMutation()

	//const isParent = useMemo(() => !data.parentTaskId, [])

	const parentId = data?.parentTaskId ?? data?.parent?.id ?? null
	const backHref = parentId ? `/${lang}/tasks/${parentId}` : `/${lang}/tasks`
	const backLabel = parentId ? t('taskView.backToParent') : t('taskView.back')

	const isParent = !data?.parentTaskId
	const requiresApproval = Boolean(data?.approval_required)
	const hasSubmitted =
		Array.isArray(data?.evidences) &&
		data?.evidences.some((ev: any) => ev.status === 'submitted')
	const hasApproved =
		Array.isArray(data?.evidences) &&
		data?.evidences.some((ev: any) => ev.status === 'approved')

	const st = statusMeta(data?.status)
	const pr = priorityMeta(data?.priority)

	//const canShowEvidenceForm = isParent && requiresApproval
	const canShowEvidenceForm = isParent && requiresApproval && !hasSubmitted && !hasApproved

	async function handleApproveEvidence(evidenceId: number) {
		await approveEvidence({ evidenceId, taskId: idNum }).unwrap()
		await refetch()
	}
	async function handleRejectEvidence(evidenceId: number) {
		await rejectEvidence({ evidenceId, taskId: idNum }).unwrap()
		await refetch()
	}

	if (!idNum) return <div className='p-6 text-red-600'>Bad task id</div>
	if (isLoading) return <div className='p-6'>{t('tasks.loading') || 'Loading...'}</div>
	if (isError || !data)
		return <div className='p-6 text-red-600'>{t('common.error') || 'Failed to load'}</div>

	return (
		<div className='space-y-8'>
			{/* Top actions */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-4xl font-bold text-slate-800 mb-2'>
						{t('taskView.title') || 'Task details'}
					</h1>
					<p className='text-xl text-slate-600'>
						{t('taskView.subtitle') || 'View and manage the task and its subtasks'}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Link href={backHref}>
						<Button variant='outline' className='bg-transparent'>
							<ArrowLeft className='h-4 w-4 ml-2' />
							{backLabel}
						</Button>
					</Link>
				</div>
			</div>

			{/* Main task card */}
			<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
				<CardHeader>
					<CardTitle className='flex items-center gap-3'>
						<FileText className='h-6 w-6 text-blue-600' />
						<span className='text-2xl text-slate-800 font-bold'>{data.title}</span>
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* status / priority / progress */}
					<div className='flex flex-wrap items-center gap-3'>
						<Badge className={st.cls}>
							<st.icon className='h-4 w-4 ml-1' />
							{t(st.labelKey) || st.fallback}
						</Badge>
						<Badge className={pr.cls}>{t(pr.labelKey) || pr.fallback}</Badge>
						{data.approval_required && (
							<Badge className='bg-indigo-100 text-indigo-700 border-indigo-200'>
								{t('taskView.approvalRequired') || 'Approval required'}
							</Badge>
						)}
					</div>

					{/* progress */}
					<div>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-slate-600'>
								{t('taskView.progress') || 'Progress'}
							</span>
							<span className='text-sm font-medium text-slate-800'>
								{data.progressPct}%
							</span>
						</div>
						<Progress value={data.progressPct} />
					</div>

					{/* meta grid */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='p-4 rounded-lg bg-slate-50'>
							<div className='text-slate-500 text-sm flex items-center gap-2 mb-1'>
								<Calendar className='h-4 w-4' />
								{t('taskView.dueDate') || 'Due date'}
							</div>
							<div className='font-semibold text-slate-800'>
								{fmtDate(data.due_at)}
							</div>
						</div>

						<div className='p-4 rounded-lg bg-slate-50'>
							<div className='text-slate-500 text-sm flex items-center gap-2 mb-1'>
								<User className='h-4 w-4' />
								{t('taskView.createdBy') || 'Created by'}
							</div>
							<div className='font-semibold text-slate-800'>
								{data.createdBy?.name || '—'}
							</div>
							{!!data.assignees?.length && (
								<div className='text-sm text-slate-600 mt-1'>
									{t('taskView.assignees') || 'Assignees'}:{' '}
									{data.assignees.map((a: any) => a.user.name).join(', ')}
								</div>
							)}
						</div>

						<div className='p-4 rounded-lg bg-slate-50'>
							<div className='text-slate-500 text-sm flex items-center gap-2 mb-1'>
								<FileText className='h-4 w-4' />
								{t('taskView.contract') || 'Contract'}
							</div>
							<div className='font-semibold text-slate-800'>
								{data.contract?.title || '—'}
							</div>
							<div className='text-xs text-slate-500'>
								{t('taskView.contractDue') || 'Contract due'}:{' '}
								{fmtDate(data.contract?.dueDate)}
							</div>
						</div>
					</div>

					{/* description */}
					{data.description && (
						<div className='p-4 rounded-lg border bg-white'>
							<div className='text-sm text-slate-500 mb-1'>
								{t('taskView.description') || 'Description'}
							</div>
							<div className='text-slate-800'>{data.description}</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Subtasks */}
			{isParent && (
				<>
					<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-xl'>
						<CardHeader className={'flex-row justify-between'}>
							<CardTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
								<Clock className='h-6 w-6 text-amber-600' />
								{t('taskView.subtasks') || 'Subtasks'}
								<span className='text-slate-500 text-base font-normal'>
									({data.children?.length || 0})
								</span>
							</CardTitle>
							<Button onClick={() => setSubOpen(true)}>
								{t('taskView.subtasksModal.createBtn')}
							</Button>
						</CardHeader>
						<CardContent>
							{data.children && data.children.length > 0 ? (
								<div className='space-y-3'>
									{data.children.map((child: any) => {
										const cst = statusMeta(child.status)
										const cpr = priorityMeta(child.priority)
										return (
											<Link
												key={child.id}
												className='block'
												href={`/${lang}/tasks/${child.id}`}
											>
												<div className='p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors'>
													<div className='flex items-start justify-between gap-4'>
														<div className='flex-1'>
															<div className='flex items-center gap-2 mb-1'>
																<span className='font-semibold text-slate-900'>
																	{child.title}
																</span>
																<Badge className={cst.cls}>
																	<cst.icon className='h-3.5 w-3.5 ml-1' />
																	{t(cst.labelKey) ||
																		cst.fallback}
																</Badge>
																<Badge className={cpr.cls}>
																	{t(cpr.labelKey) ||
																		cpr.fallback}
																</Badge>
																{child.approval_required && (
																	<Badge className='bg-indigo-100 text-indigo-700 border-indigo-200'>
																		{t(
																			'taskView.approvalRequired'
																		) || 'Approval'}
																	</Badge>
																)}
															</div>
															{child.description && (
																<div className='text-sm text-slate-700 line-clamp-2'>
																	{child.description}
																</div>
															)}

															<div className='mt-3 grid grid-cols-1 md:grid-cols-3 gap-4'>
																<div className='text-sm text-slate-600 flex items-center gap-2'>
																	<Calendar className='h-4 w-4' />
																	{t('taskView.dueDate') ||
																		'Due date'}
																	: {fmtDate(child.due_at)}
																</div>
																<div className='text-sm text-slate-600 flex items-center gap-2'>
																	<User className='h-4 w-4' />
																	{t('taskView.createdBy') ||
																		'Created by'}
																	:{' '}
																	<span className='text-slate-800 font-medium'>
																		{child.createdBy?.name ||
																			'—'}
																	</span>
																</div>
																<div>
																	<div className='flex items-center justify-between mb-1 text-sm text-slate-600'>
																		<span>
																			{t(
																				'taskView.progress'
																			) || 'Progress'}
																		</span>
																		<span className='text-slate-800 font-medium'>
																			{child.progressPct ?? 0}
																			%
																		</span>
																	</div>
																	<Progress
																		value={
																			child.progressPct ?? 0
																		}
																	/>
																</div>
															</div>
														</div>
														<ChevronRight className='h-5 w-5 text-slate-400 mt-1' />
													</div>
												</div>
											</Link>
										)
									})}
								</div>
							) : (
								<div className='text-center py-16 text-slate-600'>
									{t('taskView.noSubtasks') || 'No subtasks yet'}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{Array.isArray(data?.evidences) && requiresApproval && (
				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-xl'>
					<CardHeader>
						<CardTitle className='text-2xl font-bold text-slate-800 flex items-center gap-2'>
							<FileText className='h-6 w-6 text-indigo-600' />
							{t('taskView.evidence.title') || 'Evidences'}
							<span className='text-slate-500 text-base font-normal'>
								({data.evidences.length})
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						{data.evidences.map((ev: any) => {
							const meta = evidenceMeta(ev.status as EvidenceStatus)
							const doc = ev.document
							const isHttp =
								!!doc?.externalUrl && /^https?:\/\//i.test(String(doc.externalUrl))

							return (
								<div
									key={ev.id}
									className={`p-4 rounded-lg border ${meta.cardCls}`}
								>
									{/* Тайтл/статус/дата */}
									<div className='flex flex-col md:flex-row md:items-start md:justify-between gap-3'>
										<div className='flex items-start gap-2'>
											<meta.icon className='h-5 w-5 mt-0.5' />
											<div>
												<div className='font-semibold text-slate-900'>
													{ev.message ||
														t('taskView.evidence.noMessage') ||
														'No message'}
												</div>
												<div className='text-xs text-slate-500'>
													{t('taskView.evidence.submittedBy') ||
														'Submitted by'}
													:{' '}
													<span className='text-slate-700 font-medium'>
														{ev.submittedBy?.name || '—'}
													</span>
												</div>
											</div>
										</div>

										<div className='flex items-center gap-2'>
											<Badge className={meta.badgeCls}>
												{t(meta.labelKey) || meta.fallback}
											</Badge>
											<div className='text-sm text-slate-600'>
												{t('taskView.evidence.createdAt') || 'Created'}:{' '}
												{fmtDate(ev.created)}
											</div>
										</div>
									</div>

									{/* Документ / действия */}
									<div className='mt-3 flex flex-wrap justify-between items-center gap-3'>
										{doc ? (
											isHttp ? (
												<a
													href={doc.externalUrl as string}
													target='_blank'
													rel='noreferrer'
													className='inline-flex items-center gap-2 text-indigo-700 hover:text-indigo-800 font-medium'
												>
													<FileText className='h-4 w-4' />
													{t('taskView.evidence.openDoc') ||
														'Open document'}
													<ExternalLink className='h-3.5 w-3.5' />
												</a>
											) : (
												<div className='inline-flex items-center gap-2 text-slate-700'>
													<FileText className='h-4 w-4' />
													{doc.title ||
														t('taskView.evidence.document') ||
														'Document'}
													<span className='text-xs text-slate-500'>
														{doc.extension
															?.replace('.', '')
															.toUpperCase() || ''}
													</span>
												</div>
											)
										) : (
											<span className='text-sm text-slate-500'>
												{t('taskView.evidence.noDocument') ||
													'No document attached'}
											</span>
										)}

										{/* Кнопки только если submitted */}
										{ev.status === 'submitted' && (
											<div className='flex items-center gap-2'>
												<Button
													size='sm'
													className='bg-green-600 hover:bg-green-700 text-white'
													onClick={() => handleApproveEvidence(ev.id)}
												>
													<CheckCircle className='h-4 w-4 ml-1' />
													{t('taskView.evidence.approve') || 'Approve'}
												</Button>
												<Button
													size='sm'
													variant='outline'
													className='border-red-300 text-red-700 hover:bg-red-50'
													onClick={() => handleRejectEvidence(ev.id)}
												>
													<XCircle className='h-4 w-4 ml-1' />
													{t('taskView.evidence.reject') || 'Reject'}
												</Button>
											</div>
										)}
									</div>
								</div>
							)
						})}
					</CardContent>
				</Card>
			)}

			{canShowEvidenceForm ? (
				<EvidenceSubmitForm taskId={data.id} onSubmitted={() => refetch()} />
			) : (
				<div className='text-sm text-slate-500 mt-2'>
					{/*{hasApproved*/}
					{/*	? t('taskView.evidence.form.hiddenApproved') ||*/}
					{/*		'Evidence approved — submission is closed.'*/}
					{/*	: hasSubmitted*/}
					{/*		? t('taskView.evidence.form.hiddenSubmitted') ||*/}
					{/*			'Evidence submitted — awaiting approval.'*/}
					{/*		: null}*/}
				</div>
			)}

			<AddSubtaskModal
				isOpen={isSubOpen}
				onClose={() => setSubOpen(false)}
				parentTaskId={data.id}
				onCreated={() => refetch()}
			/>
		</div>
	)
}
