'use client'

import React, { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useGetContractsQuery } from '@/store/features/contracts/contractsApi'
import { ContractsScope, SortOrder } from '@/store/features/contracts/contractsTypes'
import ContractCard from '@/components/contracts/ContractCard'
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function ContractList() {
	const [pageNumber, setPageNumber] = useState(1)
	const [countPerPage, setCountPerPage] = useState(6)
	const [search, setSearch] = useState('')
	const [scope, setScope] = useState<ContractsScope>('all')
	const [status, setStatus] = useState<string | undefined>(undefined)
	const [sortField, setSortField] = useState('id')
	const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')

	const params = useMemo(
		() => ({
			pageNumber,
			countPerPage,
			search,
			scope,
			status,
			sortField,
			sortOrder,
		}),
		[pageNumber, countPerPage, search, scope, status, sortField, sortOrder]
	)

	const { data, isFetching, refetch } = useGetContractsQuery(params)
	const totalPages = data?.count ?? 0
	const list = data?.list ?? []

	const canPrev = pageNumber > 1
	const canNext = pageNumber < (totalPages || 0)

	return (
		<div className='max-w-7xl p-4 space-y-6'>
			{/* Фильтры */}
			<Card className='p-4 space-y-3'>
				<div className='grid grid-cols-1 md:grid-cols-6 gap-3'>
					<div className='col-span-2 flex gap-2'>
						<Input
							placeholder='Поиск по названию...'
							value={search}
							onChange={(e) => {
								setPageNumber(1)
								setSearch(e.target.value)
							}}
						/>
						<Button variant='outline' onClick={() => refetch()}>
							<Search className='w-4 h-4' />
						</Button>
					</div>

					<div>
						<Select
							value={scope}
							onValueChange={(v: ContractsScope) => {
								setPageNumber(1)
								setScope(v)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Scope' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All</SelectItem>
								<SelectItem value='created'>Created</SelectItem>
								<SelectItem value='participating'>Participating</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Select
							value={status ?? 'any'}
							onValueChange={(v) => {
								setPageNumber(1)
								setStatus(v === 'any' ? undefined : v)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='any'>Any</SelectItem>
								<SelectItem value='draft'>draft</SelectItem>
								<SelectItem value='active'>active</SelectItem>
								<SelectItem value='archived'>archived</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Select
							value={sortField}
							onValueChange={(v) => {
								setPageNumber(1)
								setSortField(v)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Sort field' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='id'>id</SelectItem>
								<SelectItem value='title'>title</SelectItem>
								<SelectItem value='effectiveDate'>effectiveDate</SelectItem>
								<SelectItem value='dueDate'>dueDate</SelectItem>
								<SelectItem value='created'>created</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='flex gap-2'>
						<Select
							value={sortOrder}
							onValueChange={(v: SortOrder) => {
								setPageNumber(1)
								setSortOrder(v)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Order' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='ASC'>ASC</SelectItem>
								<SelectItem value='DESC'>DESC</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={String(countPerPage)}
							onValueChange={(v) => {
								setPageNumber(1)
								setCountPerPage(Number(v))
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Per page' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='6'>6</SelectItem>
								<SelectItem value='12'>12</SelectItem>
								<SelectItem value='24'>24</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className='flex items-center justify-between pt-2'>
					<div className='text-sm text-slate-600'>
						Страница {pageNumber} из {totalPages || 0}
					</div>
					<div className='flex gap-2'>
						{/*<Button variant='outline' onClick={() => refetch()} disabled={isFetching}>*/}
						{/*	<RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />*/}
						{/*</Button>*/}
						<Button
							variant='outline'
							onClick={() => canPrev && setPageNumber((p) => p - 1)}
							disabled={!canPrev}
						>
							<ChevronLeft className='w-4 h-4' />
						</Button>
						<Button
							variant='outline'
							onClick={() => canNext && setPageNumber((p) => p + 1)}
							disabled={!canNext}
						>
							<ChevronRight className='w-4 h-4' />
						</Button>
					</div>
				</div>
			</Card>

			{isFetching && list.length === 0 ? (
				<div className='flex items-center justify-center py-20 text-slate-500'>
					<Loader2 className='w-5 h-5 animate-spin mr-2' />
					Загрузка контрактов...
				</div>
			) : list.length === 0 ? (
				<div className='text-center py-16 text-slate-500'>Контракты не найдены</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
					{list.map((item) => (
						<ContractCard
							key={item.id}
							item={item}
							onClick={(id) => {
								// например, роут на детальную:
								// router.push(`/contracts/${id}`)
								console.log('open contract', id)
							}}
						/>
					))}
				</div>
			)}
		</div>
	)
}
