//@ts-ignore
'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Mail, LayoutGrid, Plus, RefreshCcw, Users, XCircle, Building2, User } from 'lucide-react'

import AddClientModal from '@/components/Modals/AddClientModal'
import { useI18n } from '@/providers/I18nProvider'
import {
	useGetMyInvitationsQuery,
	useGetInvitationStatsQuery,
	useCreateInvitationMutation,
	useResendInvitationMutation,
	useCancelInvitationMutation,
} from '@/store/features/invitations/invitationsApi'
import { InvitationListItem } from '@/store/features/invitations/invitationsTypes'
import Badge from '@/components/ui/badge'

type StatusFilter = 'all' | 'Pending' | 'Activated' | 'Expired'
type ClientTypeFilter = 'all' | 'individual' | 'company'

const InvitationsPage: React.FC = () => {
	const { t } = useI18n()
	const { toast } = useToast()

	const [isAddOpen, setIsAddOpen] = useState(false)
	const [pageNumber, setPageNumber] = useState(1)
	const [countPerPage, setCountPerPage] = useState(10)
	const [search, setSearch] = useState('')
	const [status, setStatus] = useState<StatusFilter>('all')
	const [clientType, setClientType] = useState<ClientTypeFilter>('all')

	// Статы
	const {
		data: stats,
		isFetching: loadingStats,
		refetch: refetchStats,
	} = useGetInvitationStatsQuery()

	// Список
	const {
		data: listResp,
		isFetching: loadingList,
		refetch: refetchList,
	} = useGetMyInvitationsQuery({
		pageNumber,
		countPerPage,
		search: search.trim() || undefined,
		status: status === 'all' ? undefined : status,
		clientType: clientType === 'all' ? undefined : clientType,
	})

	const list = listResp?.list ?? []
	const pages = listResp?.count ?? 1
	const totalActive = stats?.activated ?? 0
	const totalPending = stats?.pending ?? 0
	const totalExpired = stats?.expired ?? 0
	const total = stats?.total ?? 0

	const [resendInvitation, { isLoading: resending }] = useResendInvitationMutation()
	const [cancelInvitation, { isLoading: cancelling }] = useCancelInvitationMutation()

	const busy = resending || cancelling

	const handleResend = async (inv: InvitationListItem) => {
		await resendInvitation(inv.id).unwrap()
		toast({
			title: t('invitationsPage.toasts.resentTitle'),
			description: t('invitationsPage.toasts.resentDesc') + ' ' + inv.email,
			className: 'bg-blue-600 text-white',
		})
		await refetchList()
	}

	const handleCancel = async (inv: InvitationListItem) => {
		if (!confirm(t('invitationsPage.confirm.cancel'))) return
		await cancelInvitation(inv.id).unwrap()
		toast({
			title: t('invitationsPage.toasts.cancelledTitle'),
			description: inv.email,
			className: 'bg-amber-600 text-white',
		})
		await Promise.all([refetchList(), refetchStats()])
	}

	const StatusBadge: React.FC<{
		status: 'Pending' | 'Activated' | 'Expired'
		labelPending: string
		labelActivated: string
		labelExpired: string
	}> = ({ status, labelPending, labelActivated, labelExpired }) => {
		if (status === 'Activated') {
			return (
				<Badge variant='outline' className='bg-green-100 text-green-700 border-green-200'>
					{labelActivated}
				</Badge>
			)
		}
		if (status === 'Expired') {
			return (
				<Badge variant='outline' className='bg-slate-200 text-slate-700 border-slate-300'>
					{labelExpired}
				</Badge>
			)
		}
		return (
			<Badge variant='outline' className='bg-amber-100 text-amber-700 border-amber-200'>
				{labelPending}
			</Badge>
		)
	}

	const TypeBadge: React.FC<{
		type: 'individual' | 'company'
		titleIndividual: string
		titleCompany: string
	}> = ({ type, titleIndividual, titleCompany }) => (
		<span className='inline-flex items-center gap-1.5'>
			{type === 'company' ? (
				<Building2 className='h-4 w-4 text-purple-600' />
			) : (
				<User className='h-4 w-4 text-blue-600' />
			)}
			<span className='text-sm text-slate-700'>
				{type === 'company' ? titleCompany : titleIndividual}
			</span>
		</span>
	)

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-4xl font-bold text-slate-800'>{t('invitationsPage.title')}</h1>
				<Button
					onClick={() => setIsAddOpen(true)}
					disabled={busy}
					className='bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg'
				>
					<Plus className='ml-2 h-5 w-5' />
					{t('invitationsPage.actions.new')}
				</Button>
			</div>

			{/* Filters */}
			<div className='flex flex-wrap items-center gap-3'>
				<Input
					placeholder={t('invitationsPage.filters.searchPlaceholder')}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
						setPageNumber(1)
					}}
					className='w-[260px]'
				/>

				<select
					className='h-9 rounded-md border px-3 text-sm'
					value={status}
					onChange={(e) => {
						setStatus(e.target.value as StatusFilter)
						setPageNumber(1)
					}}
				>
					<option value='all'>{t('invitationsPage.filters.allStatuses')}</option>
					<option value='Pending'>{t('invitationsPage.status.pending')}</option>
					<option value='Activated'>{t('invitationsPage.status.activated')}</option>
					<option value='Expired'>{t('invitationsPage.status.expired')}</option>
				</select>

				<select
					className='h-9 rounded-md border px-3 text-sm'
					value={clientType}
					onChange={(e) => {
						setClientType(e.target.value as ClientTypeFilter)
						setPageNumber(1)
					}}
				>
					<option value='all'>{t('invitationsPage.filters.allTypes')}</option>
					<option value='individual'>{t('invitationsPage.clientType.individual')}</option>
					<option value='company'>{t('invitationsPage.clientType.company')}</option>
				</select>

				<select
					className='h-9 rounded-md border px-3 text-sm'
					value={countPerPage}
					onChange={(e) => {
						setCountPerPage(Number(e.target.value))
						setPageNumber(1)
					}}
				>
					<option value={10}>{t('invitationsPage.filters.perPage10')}</option>
					<option value={20}>{t('invitationsPage.filters.perPage20')}</option>
					<option value={50}>{t('invitationsPage.filters.perPage50')}</option>
				</select>

				<Button
					variant='outline'
					size='sm'
					onClick={() => {
						refetchList()
						refetchStats()
					}}
					disabled={loadingList || loadingStats}
				>
					{loadingList || loadingStats ? (
						<>
							<RefreshCcw className='h-4 w-4 mr-1 animate-spin' />
							{t('invitationsPage.actions.refreshing')}
						</>
					) : (
						<>
							<RefreshCcw className='h-4 w-4 mr-1' />
							{t('invitationsPage.actions.refresh')}
						</>
					)}
				</Button>
			</div>

			{/* Cards (простые лоадеры-надписи) */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-slate-600'>
									{t('invitationsPage.cards.activated')}
								</p>
								<p className='text-2xl font-bold'>
									{loadingStats ? t('common.loading') : totalActive}
								</p>
							</div>
							<Users className='h-8 w-8 text-green-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-slate-600'>
									{t('invitationsPage.cards.pending')}
								</p>
								<p className='text-2xl font-bold'>
									{loadingStats ? t('common.loading') : totalPending}
								</p>
							</div>
							<Mail className='h-8 w-8 text-amber-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-slate-600'>
									{t('invitationsPage.cards.expired')}
								</p>
								<p className='text-2xl font-bold'>
									{loadingStats ? t('common.loading') : totalExpired}
								</p>
							</div>
							<XCircle className='h-8 w-8 text-slate-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-slate-600'>
									{t('invitationsPage.cards.total')}
								</p>
								<p className='text-2xl font-bold'>
									{loadingStats ? t('common.loading') : total}
								</p>
							</div>
							<LayoutGrid className='h-8 w-8 text-indigo-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* List */}
			<Card className='border-0 shadow-xl'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold'>
						{t('invitationsPage.table.title')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='overflow-x-auto'>
						<Table>
							<TableHeader>
								<TableRow className='bg-slate-50/50'>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.name')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.type')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.email')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.phone')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.status')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.expires')}
									</TableHead>
									<TableHead className='font-bold'>
										{t('invitationsPage.table.columns.actions')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loadingList ? (
									<TableRow>
										<TableCell colSpan={7} className='text-center py-6'>
											{t('common.loading')}
										</TableCell>
									</TableRow>
								) : list.length > 0 ? (
									list.map((inv) => (
										<TableRow key={inv.id} className='hover:bg-blue-50/30'>
											<TableCell className='font-semibold'>
												{inv.fullName || inv.companyName || '—'}
											</TableCell>
											<TableCell>
												<TypeBadge
													type={inv.clientType}
													titleIndividual={t(
														'invitationsPage.clientType.individual'
													)}
													titleCompany={t(
														'invitationsPage.clientType.company'
													)}
												/>
											</TableCell>
											<TableCell className='text-slate-600'>
												{inv.email}
											</TableCell>
											<TableCell className='text-slate-600'>
												{inv.phone || '—'}
											</TableCell>
											<TableCell>
												<StatusBadge
													status={inv.status}
													labelPending={t(
														'invitationsPage.status.pending'
													)}
													labelActivated={t(
														'invitationsPage.status.activated'
													)}
													labelExpired={t(
														'invitationsPage.status.expired'
													)}
												/>
											</TableCell>
											<TableCell className='text-slate-600'>
												{new Date(inv.expiresAt).toLocaleDateString(
													'he-IL'
												)}
											</TableCell>
											<TableCell>
												<div className='flex gap-2'>
													<Button
														variant='outline'
														size='sm'
														disabled={
															busy || inv.status === 'Activated'
														}
														onClick={() => handleResend(inv)}
													>
														{resending ? (
															<RefreshCcw className='h-4 w-4 animate-spin' />
														) : (
															<RefreshCcw className='h-4 w-4' />
														)}
													</Button>
													<Button
														variant='outline'
														size='sm'
														disabled={
															busy || inv.status === 'Activated'
														}
														onClick={() => handleCancel(inv)}
													>
														{cancelling ? (
															<XCircle className='h-4 w-4 animate-spin' />
														) : (
															<XCircle className='h-4 w-4' />
														)}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className='text-center py-10 text-slate-500'
										>
											{t('invitationsPage.empty')}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{!loadingList && pages > 1 && (
						<div className='flex items-center justify-end gap-3 mt-4'>
							<Button
								variant='outline'
								size='sm'
								disabled={pageNumber <= 1 || loadingList}
								onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
							>
								{t('invitationsPage.pagination.prev')}
							</Button>
							<div className='text-sm text-slate-600'>
								{t('invitationsPage.pagination.page')} {pageNumber}{' '}
								{t('invitationsPage.pagination.of')} {pages}
							</div>
							<Button
								variant='outline'
								size='sm'
								disabled={pageNumber >= pages || loadingList}
								onClick={() => setPageNumber((p) => Math.min(pages, p + 1))}
							>
								{t('invitationsPage.pagination.next')}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<AddClientModal
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
				refetchInvites={() => {
					refetchList()
					refetchStats()
				}}
			/>
		</div>
	)
}

export default InvitationsPage
