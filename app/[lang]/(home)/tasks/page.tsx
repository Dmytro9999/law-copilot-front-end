'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useI18n, useLocale } from '@/providers/I18nProvider'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

import AddTaskModal from '@/components/Modals/AddTaskModal'

// RTK
import {
	useGetTasksQuery,
	useDeleteTaskMutation,
	useUpdateTaskMutation,
} from '@/store/features/tasks/tasksApi'
import { useGetContractsQuery } from '@/store/features/contracts/contractsApi'

// Icons
import {
	FileText,
	Clock,
	TrendingUp,
	LayoutGrid,
	Edit,
	Trash2,
	Plus,
	CheckCircle2,
	PauseCircle,
	Filter,
} from 'lucide-react'

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'awaiting_approval' | 'cancelled'
type Priority = 'low' | 'medium' | 'high'

export default function TasksPage() {
	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'
	const { toast } = useToast()

	// --------- Фильтры/пагинация ----------
	const [search, setSearch] = useState('')
	const [status, setStatus] = useState<TaskStatus | 'all'>('all')
	const [contractId, setContractId] = useState<number | 'all'>('all')
	const [pageNumber, setPageNumber] = useState(1)
	const countPerPage = 10

	// Контракты для селекта и модалки
	const { data: contractsResp, isLoading: loadingContracts } = useGetContractsQuery({
		pageNumber: 1,
		countPerPage: 100,
		search: '',
		sortOrder: 'DESC',
		sortField: 'id',
		scope: 'all',
	})

	const contracts = useMemo(
		() => (contractsResp?.list ?? []).map((c: any) => ({ id: c.id, title: c.title })),
		[contractsResp]
	)

	// Задачи
	const {
		data: tasksResp,
		isFetching: loadingTasks,
		error: tasksError,
		refetch: refetchTasks,
	} = useGetTasksQuery({
		pageNumber,
		countPerPage,
		search: search.trim(),
		status: status === 'all' ? undefined : status,
		contractId: contractId === 'all' ? undefined : contractId,
		sortField: 'id',
		sortOrder: 'DESC',
	})

	const tasks: any[] = tasksResp?.list ?? []
	const totalPages: number = tasksResp?.count ?? 0

	// Мутаторы
	const [deleteTask, { isLoading: deleting }] = useDeleteTaskMutation()
	const [updateTask, { isLoading: updating }] = useUpdateTaskMutation()

	// --------- Счётчики (по загруженному списку) ----------
	const stats = useMemo(() => {
		const pending = tasks.filter((t) => t.status === 'todo').length
		const inProgress = tasks.filter((t) => t.status === 'in_progress').length
		const completed = tasks.filter((t) => t.status === 'done').length
		const total = tasks.length
		return { pending, inProgress, completed, total }
	}, [tasks])

	// --------- Helpers ----------
	function priorityBadgeClass(p: Priority) {
		switch (p) {
			case 'low':
				return 'bg-green-100 text-green-700 border-green-200'
			case 'high':
				return 'bg-orange-100 text-orange-700 border-orange-200'
			case 'medium':
				return 'bg-yellow-100 text-yellow-700 border-yellow-200'
			default:
				return 'bg-green-100 text-green-700 border-green-200'
		}
	}

	function statusBadge(s: TaskStatus) {
		const tt = (key: string) => {
			const v = t?.(key)
			return typeof v === 'string' && v.length && v
		}

		switch (s) {
			case 'done':
				return (
					<Badge
						className='bg-green-100 text-green-700 border-green-200'
						variant='outline'
					>
						{tt('taskView.status.done')}
					</Badge>
				)

			case 'in_progress':
				return (
					<Badge
						className='bg-amber-100 text-amber-700 border-amber-200'
						variant='outline'
					>
						{tt('taskView.status.in_progress')}
					</Badge>
				)

			case 'awaiting_approval':
				return (
					<Badge
						className='bg-indigo-100 text-indigo-700 border-indigo-200'
						variant='outline'
					>
						{tt('taskView.status.awaiting_approval')}
					</Badge>
				)

			case 'cancelled':
				return (
					<Badge className='bg-rose-100 text-rose-700 border-rose-200' variant='outline'>
						{tt('taskView.status.cancelled')}
					</Badge>
				)

			case 'todo':
			default:
				return (
					<Badge
						className='bg-slate-100 text-slate-700 border-slate-200'
						variant='outline'
					>
						{tt('taskView.status.todo')}
					</Badge>
				)
		}
	}

	// --------- Actions ----------
	async function handleDelete(id: number) {
		const ok = confirm(t('tasks.confirm.delete') || 'למחוק את המשימה?')
		if (!ok) return
		try {
			await deleteTask(id).unwrap()
			toast({ title: t('tasks.toast.deleted') || 'נמחקה', description: '' })
			refetchTasks()
		} catch (err: any) {
			toast({
				title: t('tasks.toast.error') || 'שגיאה',
				description: err?.data?.message || err?.message || '',
				variant: 'destructive',
			})
		}
	}

	async function handleStatus(id: number, s: TaskStatus) {
		try {
			await updateTask({ id, patch: { status: s } }).unwrap()
			toast({
				title: t('tasks.toast.updated') || 'עודכן',
				description: '',
			})
			refetchTasks()
		} catch (err: any) {
			toast({
				title: t('tasks.toast.error') || 'שגיאה',
				description: err?.data?.message || err?.message || '',
				variant: 'destructive',
			})
		}
	}

	// --------- Modal (Create) ----------
	const [isAddOpen, setIsAddOpen] = useState(false)
	function openCreate() {
		setIsAddOpen(true)
	}
	function onCreated() {
		refetchTasks()
	}

	// --------- UI ----------
	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-4xl font-bold text-slate-800 mb-3'>
						{t('tasks.title') || 'ניהול משימות'}
					</h1>
					<p className='text-xl text-slate-600'>
						{t('tasks.subtitle') || 'נהל את המשימות האישיות והמקצועיות שלך'}
					</p>
				</div>
				<Button
					onClick={openCreate}
					className='bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg'
				>
					<Plus className='ml-2 h-5 w-5' />
					{t('tasks.addNew') || 'הוסף משימה חדשה'}
				</Button>
			</div>

			{/* Filters */}
			<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
				<CardContent className='p-6'>
					<div className='flex flex-col md:flex-row gap-4 items-end'>
						<div className='flex-1'>
							<Label className='text-sm font-semibold text-slate-700'>
								{t('tasks.filters.search') || 'חיפוש'}
							</Label>
							<div className='flex gap-2'>
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={
										t('tasks.filters.searchPh') || 'חפש לפי כותרת או תיאור'
									}
									className='h-11'
								/>
								<Button
									variant='outline'
									className='h-11'
									onClick={() => {
										setPageNumber(1)
										refetchTasks()
									}}
								>
									<Filter className='h-4 w-4 mr-2' />
									{t('tasks.filters.apply') || 'החל'}
								</Button>
							</div>
						</div>

						<div className='w-full md:w-48'>
							<Label className='text-sm font-semibold text-slate-700'>
								{t('tasks.filters.status') || 'סטטוס'}
							</Label>
							<Select
								value={status}
								onValueChange={(v: any) => {
									setStatus(v)
									setPageNumber(1)
								}}
							>
								<SelectTrigger className='h-11'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										{t('tasks.status.all') || 'כולם'}
									</SelectItem>
									<SelectItem value='todo'>Todo</SelectItem>
									<SelectItem value='awaiting_approval'>
										Awaiting Approval
									</SelectItem>
									<SelectItem value='in_progress'>
										{t('tasks.status.inProgress') || 'בביצוע'}
									</SelectItem>
									<SelectItem value='done'>
										{t('tasks.status.completed') || 'הושלמה'}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='w-full md:w-64'>
							<Label className='text-sm font-semibold text-slate-700'>
								{t('tasks.filters.contract') || 'חוזה'}
							</Label>
							<Select
								value={contractId === 'all' ? 'all' : String(contractId)}
								onValueChange={(v) => {
									setContractId(v === 'all' ? 'all' : Number(v))
									setPageNumber(1)
								}}
							>
								<SelectTrigger className='h-11'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										{t('tasks.filters.allContracts') || 'כל החוזים'}
									</SelectItem>
									{contracts.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats (по загруженным задачам) */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>
									{t('tasks.stats.pending') || 'משימות פעילות'}
								</p>
								<p className='text-2xl font-bold text-slate-900'>{stats.pending}</p>
							</div>
							<FileText className='h-8 w-8 text-blue-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>
									{t('tasks.stats.inProgress') || 'בביצוע'}
								</p>
								<p className='text-2xl font-bold text-slate-900'>
									{stats.inProgress}
								</p>
							</div>
							<Clock className='h-8 w-8 text-amber-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>
									{t('tasks.stats.completed') || 'הושלמו'}
								</p>
								<p className='text-2xl font-bold text-slate-900'>
									{stats.completed}
								</p>
							</div>
							<TrendingUp className='h-8 w-8 text-green-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>
									{t('tasks.stats.total') || 'סה״כ משימות'}
								</p>
								<p className='text-2xl font-bold text-slate-900'>{stats.total}</p>
							</div>
							<LayoutGrid className='h-8 w-8 text-purple-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* List */}
			{loadingTasks ? (
				<div className='text-slate-600'>{t('common.loading') || 'טוען...'}</div>
			) : tasksError ? (
				<div className='text-red-600'>{t('common.error') || 'שגיאה בטעינה'}</div>
			) : tasks.length > 0 ? (
				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-xl'>
					<CardHeader>
						<CardTitle className='text-2xl font-bold text-slate-800'>
							{t('tasks.listTitle') || 'רשימת משימות'}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow className='bg-slate-50/50'>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.title') || 'כותרת'}
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.contract') || 'חוזה'}
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.priority') || 'עדיפות'}
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.status') || 'סטטוס'}
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.due') || 'יעד'}
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											{t('tasks.th.actions') || 'פעולות'}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tasks.map((task: any) => (
										<TableRow key={task.id} className='hover:bg-blue-50/30'>
											<TableCell className='font-semibold text-slate-800'>
												<div className='flex flex-col'>
													<Link href={`/${lang}/tasks/${task.id}`}>
														<span>{task.title}</span>
													</Link>

													{task.description && (
														<Link href={`/${lang}/tasks/${task.id}`}>
															<span className='text-xs text-slate-500 mt-1 line-clamp-2'>
																{task.description}
															</span>
														</Link>
													)}
												</div>
											</TableCell>

											<TableCell className='text-slate-700'>
												{task.contract?.title ? (
													<Link
														href={`/${lang}/contracts/${task.contract.id}`}
														className='text-blue-600 hover:text-blue-700'
													>
														{task.contract.title}
													</Link>
												) : (
													<span className='text-slate-400'>—</span>
												)}
											</TableCell>

											<TableCell>
												<Badge
													variant='outline'
													className={priorityBadgeClass(
														task.priority as Priority
													)}
												>
													{task.priority === 'urgent'
														? t('tasks.priority.urgent') || 'דחופה'
														: task.priority === 'high'
															? t('tasks.priority.high') || 'גבוהה'
															: task.priority === 'medium'
																? t('tasks.priority.medium') ||
																	'בינונית'
																: t('tasks.priority.low') ||
																	'נמוכה'}
												</Badge>
											</TableCell>

											<TableCell>
												{statusBadge(task.status as TaskStatus)}
											</TableCell>

											<TableCell className='text-slate-700'>
												{task.due_at
													? new Date(task.due_at).toLocaleDateString()
													: '—'}
											</TableCell>

											<TableCell>
												<div className='flex gap-2'>
													{task.status !== 'in_progress' && (
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleStatus(task.id, 'in_progress')
															}
															disabled={updating}
														>
															<PauseCircle className='h-4 w-4 mr-1' />
															{t('tasks.actions.inProgress') ||
																'בביצוע'}
														</Button>
													)}
													{task.status !== 'done' && (
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleStatus(task.id, 'done')
															}
															disabled={updating}
														>
															<CheckCircle2 className='h-4 w-4 mr-1' />
															{t('tasks.actions.complete') ||
																'סמן כהושלמה'}
														</Button>
													)}
													<Button
														variant='outline'
														size='sm'
														className='text-red-600 bg-transparent'
														onClick={() => handleDelete(task.id)}
														disabled={deleting}
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination */}
							<div className='flex items-center justify-between mt-6'>
								<div className='text-sm text-slate-600'>
									{t('tasks.pagination.page') || 'עמוד'} {pageNumber} /{' '}
									{totalPages || 1}
								</div>
								<div className='flex gap-2'>
									<Button
										variant='outline'
										onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
										disabled={pageNumber <= 1}
									>
										{t('tasks.pagination.prev') || 'הקודם'}
									</Button>
									<Button
										variant='outline'
										onClick={() =>
											setPageNumber((p) =>
												totalPages ? Math.min(totalPages, p + 1) : p + 1
											)
										}
										disabled={totalPages ? pageNumber >= totalPages : false}
									>
										{t('tasks.pagination.next') || 'הבא'}
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className='text-center py-20'>
					<FileText className='h-24 w-24 text-slate-300 mx-auto mb-6' />
					<h2 className='text-2xl font-bold text-slate-800 mb-4'>
						{t('tasks.empty.title') || 'אין משימות עדיין'}
					</h2>
					<p className='text-lg text-slate-600 mb-8'>
						{t('tasks.empty.subtitle') || 'התחל בהוספת המשימה הראשונה שלך'}
					</p>
				</div>
			)}

			{/* Modal */}
			<AddTaskModal
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
				contracts={contracts}
				onCreated={onCreated}
			/>
		</div>
	)
}
