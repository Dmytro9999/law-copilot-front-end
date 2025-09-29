'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetContractsQuery } from '@/store/features/contracts/contractsApi'
import { useGetMeetingSummariesQuery } from '@/store/features/meeting-summary/meeting-summary'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import {
	Calendar,
	FileText,
	Loader2,
	MessageSquare,
	Search,
	X,
	ChevronLeft,
	ChevronRight,
	Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import MeetingSummaryModal from '@/components/Modals/MeetingSummaryModal'

type ContractOption = { id: number | string; label: string }

/** ---------- Mini i18n ---------- */
const dict = {
	he: {
		title: 'סיכומי פגישות',
		subtitle: 'חיפוש לפי כותרת וסינון לפי חוזה',
		newMeeting: 'פגישה חדשה',
		searchLabel: 'חפש לפי כותרת',
		searchPlaceholder: 'הקלד שם פגישה…',
		contractLabel: 'חוזה',
		allContracts: 'כל החוזים',
		clearFilters: 'נקה מסננים',
		loading: 'טוען נתונים…',
		emptyTitle: 'אין סיכומים',
		emptyText: 'נסה לשנות מסננים או צור סיכום חדש.',
		summary: 'סיכום:',
		keyPoints: 'נקודות עיקריות:',
		moreN: (n: number) => `+${n} נוספים`,
		open: 'פתח',
		prev: 'הקודם',
		next: 'הבא',
		pageOf: (p: number, t: number) => `עמוד ${p} מתוך ${t}`,
		docBadge: 'מסמך',
		toastOpenTitle: 'צפייה בפרטים',
		toastOpenDesc: 'בקרוב: מסך פרטי הסיכום',
	},
	en: {
		title: 'Meeting Summaries',
		subtitle: 'Search by title and filter by contract',
		newMeeting: 'New Meeting',
		searchLabel: 'Search by title',
		searchPlaceholder: 'Type a meeting title…',
		contractLabel: 'Contract',
		allContracts: 'All contracts',
		clearFilters: 'Clear filters',
		loading: 'Loading…',
		emptyTitle: 'No summaries yet',
		emptyText: 'Try changing filters or create a new summary.',
		summary: 'Summary:',
		keyPoints: 'Key points:',
		moreN: (n: number) => `+${n} more`,
		open: 'Open',
		prev: 'Previous',
		next: 'Next',
		pageOf: (p: number, t: number) => `Page ${p} of ${t}`,
		docBadge: 'Document',
		toastOpenTitle: 'View details',
		toastOpenDesc: 'Coming soon: summary details page',
	},
} as const

function useI18n() {
	const params = useParams() as { lang?: string }
	const lang = (params?.lang === 'he' ? 'he' : 'en') as keyof typeof dict
	const t = <K extends keyof (typeof dict)['en']>(key: K) => dict[lang][key]
	const dir = lang === 'he' ? 'rtl' : 'ltr'
	return { lang, dir, t }
}

/** ---------- Pager ---------- */
function Pager({
	page,
	totalPages,
	onPage,
	t,
}: {
	page: number
	totalPages: number
	onPage: (p: number) => void
	t: ReturnType<typeof useI18n>['t']
}) {
	const prev = () => onPage(Math.max(1, page - 1))
	const next = () => onPage(Math.min(totalPages || 1, page + 1))
	if (!totalPages || totalPages <= 1) return null
	return (
		<div className='flex items-center justify-center gap-2 mt-6'>
			<Button variant='outline' size='sm' onClick={prev} disabled={page <= 1}>
				<ChevronLeft className='ml-1 h-4 w-4' /> {t('prev') as string}
			</Button>
			<div className='text-sm text-slate-600'>
				{(dict.en.pageOf as any)(0, 0) && (dict as any)}
				{/* noop to keep TS happy */}
				{(dict.en.pageOf as any) && (t('pageOf') as any)(page, totalPages)}
			</div>
			<Button variant='outline' size='sm' onClick={next} disabled={page >= totalPages}>
				{t('next') as string} <ChevronRight className='mr-1 h-4 w-4' />
			</Button>
		</div>
	)
}

export default function MeetingSummariesPage() {
	const { t, dir, lang } = useI18n()

	// ---- Local filters ----
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [contractId, setContractId] = useState<string>('all') // 'all' = no filter
	const [page, setPage] = useState(1)
	const perPage = 12
	const [isMeetingSummaryModalOpen, setMeetingSummaryModalOpen] = useState(false)

	useEffect(() => {
		const tmr = setTimeout(() => setDebouncedSearch(search.trim()), 350)
		return () => clearTimeout(tmr)
	}, [search])

	useEffect(() => {
		setPage(1)
	}, [debouncedSearch, contractId])

	// ---- Data ----
	const { data, isFetching, isError, error } = useGetMeetingSummariesQuery({
		search: debouncedSearch || undefined,
		contractId: contractId !== 'all' ? contractId : undefined,
		page,
		perPage,
	})

	const { data: contractsData } = useGetContractsQuery({
		pageNumber: 1,
		countPerPage: 100,
		scope: 'all',
		status: 'active',
		sortField: 'id',
		sortOrder: 'DESC',
	})

	const contractOptions: ContractOption[] = useMemo(() => {
		const items = (contractsData as any)?.items || (contractsData as any)?.data || []
		return items.map((c: any) => ({
			id: c.id,
			label: c.title || c.name || `Contract #${c.id}`,
		}))
	}, [contractsData])

	useEffect(() => {
		if (isError) {
			const msg =
				(error as any)?.data?.message || (error as any)?.error || (t('loading') as string)
			toast.error(String(msg))
		}
	}, [isError, error, t])

	const items = data?.items || []
	const meta = data?.meta || { page: 1, perPage, total: 0, totalPages: 0 }

	return (
		<div className='space-y-8' dir={dir}>
			{/* Header + Filters */}
			<div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
				<div className='space-y-2'>
					<h3 className='text-2xl font-bold text-slate-800'>{t('title') as string}</h3>
					<p className='text-slate-600'>{t('subtitle') as string}</p>

					<Button
						onClick={() => setMeetingSummaryModalOpen(true)}
						className='bg-gradient-to-l from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3'
					>
						<Plus className='ml-2 h-5 w-5' />
						{t('newMeeting') as string}
					</Button>
				</div>

				<div className='flex flex-col md:flex-row gap-3 md:items-end'>
					<div className='flex flex-col'>
						<span className='text-xs text-slate-500 mb-1'>
							{t('searchLabel') as string}
						</span>
						<div className='flex items-center gap-2'>
							<div className='relative'>
								<Search className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={t('searchPlaceholder') as string}
									className='pr-8 w-64'
								/>
							</div>
							{search && (
								<Button variant='ghost' size='icon' onClick={() => setSearch('')}>
									<X className='h-4 w-4' />
								</Button>
							)}
						</div>
					</div>

					<div className='flex flex-col'>
						<span className='text-xs text-slate-500 mb-1'>
							{t('contractLabel') as string}
						</span>
						<Select value={contractId} onValueChange={setContractId}>
							<SelectTrigger className='w-64'>
								<SelectValue placeholder={t('allContracts') as string} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>{t('allContracts') as string}</SelectItem>
								{contractOptions.map((c) => (
									<SelectItem key={c.id} value={String(c.id)}>
										{c.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{(debouncedSearch || contractId !== 'all') && (
						<Button
							variant='outline'
							onClick={() => {
								setSearch('')
								setContractId('all')
							}}
						>
							{t('clearFilters') as string}
						</Button>
					)}
				</div>
			</div>

			{/* List / States */}
			{isFetching && (
				<Card className='p-12 text-center border-slate-200'>
					<Loader2 className='mx-auto h-6 w-6 animate-spin text-slate-500 mb-2' />
					<div className='text-slate-600 text-sm'>{t('loading') as string}</div>
				</Card>
			)}

			{!isFetching && items.length === 0 && (
				<Card className='p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200'>
					<MessageSquare className='mx-auto h-16 w-16 text-slate-400 mb-4' />
					<h3 className='text-xl font-semibold text-slate-700 mb-2'>
						{t('emptyTitle') as string}
					</h3>
					<p className='text-slate-500'>{t('emptyText') as string}</p>
				</Card>
			)}

			{items.length > 0 && (
				<>
					<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{items.map((m) => (
							<Card
								key={m.id}
								className='p-6 hover:shadow-lg transition-all duration-200 border-slate-200 bg-white'
							>
								<div className='space-y-4'>
									{/* Header */}
									<div className='flex justify-between items-start'>
										<div className='flex-1'>
											<h4 className='font-semibold text-slate-800 text-lg mb-1'>
												{m.title}
											</h4>
											<div className='flex items-center gap-2 text-sm text-slate-500'>
												<Calendar className='h-4 w-4' />
												<span>
													{new Date(m.meetingDate).toLocaleDateString(
														lang === 'he' ? 'he-IL' : 'en-US'
													)}
												</span>
											</div>
										</div>
										<div className='flex items-center gap-2'>
											{m.contract && (
												<Badge variant='outline' className='text-xs'>
													{m.contract.title ||
														(m.contract as any).name ||
														`Contract #${m.contract.id}`}
												</Badge>
											)}
											{m.document && (
												<Badge
													variant='secondary'
													className='text-xs flex items-center gap-1'
												>
													<FileText className='h-3 w-3' />{' '}
													{t('docBadge') as string}
												</Badge>
											)}
										</div>
									</div>

									{/* Summary preview */}
									<div>
										<h5 className='font-medium text-slate-700 mb-2'>
											{t('summary') as string}
										</h5>
										<p className='text-sm text-slate-600 line-clamp-3'>
											{m.summary}
										</p>
									</div>

									{/* Key points */}
									{m.keyPoints && m.keyPoints.length > 0 && (
										<div>
											<h6 className='text-xs font-medium text-slate-600 mb-1'>
												{t('keyPoints') as string}
											</h6>
											<ul className='text-sm text-slate-700 list-disc mr-4 space-y-1'>
												{m.keyPoints.slice(0, 3).map((kp, idx) => (
													<li key={idx}>{kp}</li>
												))}
											</ul>
											{m.keyPoints.length > 3 && (
												<div className='text-xs text-slate-500 mt-1'>
													{(dict.en.moreN as any) &&
														(t('moreN') as any)(m.keyPoints.length - 3)}
												</div>
											)}
										</div>
									)}

									{/* Actions */}
									<div className='flex justify-end pt-3 border-t border-slate-100'>
										<Button
											variant='ghost'
											size='sm'
											className='text-xs h-8 px-3'
											onClick={() =>
												toast.info(t('toastOpenTitle') as string, {
													description: t('toastOpenDesc') as string,
												})
											}
										>
											{t('open') as string}
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>

					<Pager
						page={meta.page}
						totalPages={meta.totalPages}
						onPage={(p) => setPage(p)}
						t={t}
					/>
				</>
			)}

			<MeetingSummaryModal
				isOpen={isMeetingSummaryModalOpen}
				onClose={() => setMeetingSummaryModalOpen(false)}
				onSaveSummary={() => {}}
				contracts={contractOptions}
			/>
		</div>
	)
}
