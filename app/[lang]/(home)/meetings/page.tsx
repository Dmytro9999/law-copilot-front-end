'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useGetContractsQuery } from '@/store/features/contracts/contractsApi'
import { useGetMeetingSummariesQuery } from '@/store/features/meeting-summary/meeting-summary'
import { useI18n, useLocale } from '@/providers/I18nProvider'

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

// ---------- Pager ----------
function Pager({
	page,
	totalPages,
	onPage,
	t,
	tf,
}: {
	page: number
	totalPages: number
	onPage: (p: number) => void
	t: (k: string, fb?: string) => string
	tf: (k: string, fb: string, vars?: Record<string, string | number>) => string
}) {
	const prev = () => onPage(Math.max(1, page - 1))
	const next = () => onPage(Math.min(totalPages || 1, page + 1))
	if (!totalPages || totalPages <= 1) return null
	return (
		<div className='flex items-center justify-center gap-2 mt-6'>
			<Button variant='outline' size='sm' onClick={prev} disabled={page <= 1}>
				<ChevronLeft className='ml-1 h-4 w-4' />{' '}
				{t('meetingSummaries.pagination.prev', 'Previous')}
			</Button>
			<div className='text-sm text-slate-600'>
				{tf('meetingSummaries.pagination.pageOf', 'Page {page} of {total}', {
					page,
					total: totalPages,
				})}
			</div>
			<Button variant='outline' size='sm' onClick={next} disabled={page >= totalPages}>
				{t('meetingSummaries.pagination.next', 'Next')}{' '}
				<ChevronRight className='mr-1 h-4 w-4' />
			</Button>
		</div>
	)
}

export default function MeetingSummariesPage() {
	const { t } = useI18n()
	const locale = useLocale()
	const dir = locale === 'he' ? 'rtl' : 'ltr'

	// простой formatter для подстановок {var}
	const tf = (key: string, fallback: string, vars?: Record<string, string | number>) => {
		let s = t(key, fallback) as string
		if (vars) {
			Object.entries(vars).forEach(([k, v]) => {
				s = s.replaceAll(`{${k}}`, String(v))
			})
		}
		return s
	}

	// ---- Локальные фильтры ----
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [contractId, setContractId] = useState<string>('all') // 'all' = без фильтра
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

	// ---- Данные ----
	const {
		data,
		isFetching,
		isError,
		error,
		refetch: refetchMeetingSummaries,
	} = useGetMeetingSummariesQuery({
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
		const items = (contractsData as any)?.list || []
		return items.map((c: any) => ({
			id: c.id,
			label: c.title || c.name || `Contract #${c.id}`,
		}))
	}, [contractsData])

	useEffect(() => {
		if (isError) {
			const msg =
				(error as any)?.data?.message ||
				(error as any)?.error ||
				t('meetingSummaries.loading', 'Loading…')
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
					<h3 className='text-2xl font-bold text-slate-800'>
						{t('meetingSummaries.title', 'Meeting Summaries')}
					</h3>
					<p className='text-slate-600'>
						{t('meetingSummaries.subtitle', 'Search by title and filter by contract')}
					</p>

					<Button
						onClick={() => setMeetingSummaryModalOpen(true)}
						className='bg-gradient-to-l from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3'
					>
						<Plus className='ml-2 h-5 w-5' />
						{t('meetingSummaries.new', 'New Meeting')}
					</Button>
				</div>

				<div className='flex flex-col md:flex-row gap-3 md:items-end'>
					<div className='flex flex-col'>
						<span className='text-xs text-slate-500 mb-1'>
							{t('meetingSummaries.search.label', 'Search by title')}
						</span>
						<div className='flex items-center gap-2'>
							<div className='relative'>
								<Search className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={t(
										'meetingSummaries.search.placeholder',
										'Type a meeting title…'
									)}
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
							{t('meetingSummaries.contract.label', 'Contract')}
						</span>
						<Select value={contractId} onValueChange={setContractId}>
							<SelectTrigger className='w-64'>
								<SelectValue
									placeholder={t(
										'meetingSummaries.contract.all',
										'All contracts'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									{t('meetingSummaries.contract.all', 'All contracts')}
								</SelectItem>
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
							{t('meetingSummaries.filters.clear', 'Clear filters')}
						</Button>
					)}
				</div>
			</div>

			{/* List / States */}
			{isFetching && (
				<Card className='p-12 text-center border-slate-200'>
					<Loader2 className='mx-auto h-6 w-6 animate-spin text-slate-500 mb-2' />
					<div className='text-slate-600 text-sm'>
						{t('meetingSummaries.loading', 'Loading…')}
					</div>
				</Card>
			)}

			{!isFetching && items.length === 0 && (
				<Card className='p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200'>
					<MessageSquare className='mx-auto h-16 w-16 text-slate-400 mb-4' />
					<h3 className='text-xl font-semibold text-slate-700 mb-2'>
						{t('meetingSummaries.empty.title', 'No summaries yet')}
					</h3>
					<p className='text-slate-500'>
						{t(
							'meetingSummaries.empty.text',
							'Try changing filters or create a new summary.'
						)}
					</p>
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
														locale === 'he' ? 'he-IL' : 'en-US'
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
													{t('meetingSummaries.docBadge', 'Document')}
												</Badge>
											)}
										</div>
									</div>

									{/* Summary preview */}
									<div>
										<h5 className='font-medium text-slate-700 mb-2'>
											{t('meetingSummaries.summary', 'Summary:')}
										</h5>
										<p className='text-sm text-slate-600 line-clamp-3'>
											{m.summary}
										</p>
									</div>

									{/* Key points */}
									{m.keyPoints && m.keyPoints.length > 0 && (
										<div>
											<h6 className='text-xs font-medium text-slate-600 mb-1'>
												{t('meetingSummaries.keyPoints', 'Key points:')}
											</h6>
											<ul className='text-sm text-slate-700 list-disc mr-4 space-y-1'>
												{m.keyPoints.slice(0, 3).map((kp, idx) => (
													<li key={idx}>{kp}</li>
												))}
											</ul>
											{m.keyPoints.length > 3 && (
												<div className='text-xs text-slate-500 mt-1'>
													{tf(
														'meetingSummaries.keyPoints.more',
														'+{n} more',
														{ n: m.keyPoints.length - 3 }
													)}
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
												toast.info(
													t('meetingSummaries.actions.open', 'Open'),
													{
														description: t(
															'meetingSummaries.actions.openDesc',
															'Coming soon: summary details page'
														),
													}
												)
											}
										>
											{t('meetingSummaries.actions.open', 'Open')}
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
						tf={tf}
					/>
				</>
			)}

			<MeetingSummaryModal
				isOpen={isMeetingSummaryModalOpen}
				onClose={() => setMeetingSummaryModalOpen(false)}
				onSaveSummary={() => {
					refetchMeetingSummaries()
				}}
				contracts={contractOptions}
			/>
		</div>
	)
}
