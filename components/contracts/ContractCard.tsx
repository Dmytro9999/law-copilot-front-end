'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Calendar, ShieldCheck } from 'lucide-react'
import { ContractListItem } from '@/store/features/contracts/contractsTypes'

interface Props {
	item: ContractListItem
	onClick?: (id: number) => void
}

const statusTone: Record<string, string> = {
	draft: 'bg-amber-100 text-amber-800 border-amber-200',
	active: 'bg-green-100 text-green-800 border-green-200',
	archived: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function ContractCard({ item, onClick }: Props) {
	const sClass = statusTone[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'

	const start = item.effectiveDate
		? new Date(item.effectiveDate).toLocaleDateString('he-IL')
		: '—'
	const end = item.dueDate ? new Date(item.dueDate).toLocaleDateString('he-IL') : '—'

	return (
		<Card
			className='hover:shadow-md transition cursor-pointer'
			onClick={() => onClick?.(item.id)}
		>
			<CardHeader className='pb-3'>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<FileText className='w-5 h-5 text-blue-600' />
						<span className='mt-2 leading-7'>{item.title}</span>
					</CardTitle>
					<Badge className={sClass}>{item.status}</Badge>
				</div>
				{item.description && (
					<p className='text-sm text-slate-600 line-clamp-2 mt-2'>{item.description}</p>
				)}
			</CardHeader>
			<CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm'>
				<div className='flex items-center gap-2 text-slate-700'>
					<Users className='w-4 h-4 text-slate-500' />
					<span className='truncate'>Client: {item.client?.name || '—'}</span>
				</div>
				<div className='flex items-center gap-2 text-slate-700'>
					<ShieldCheck className='w-4 h-4 text-slate-500' />
					<span className='truncate'>My role: {item.myRole || '—'}</span>
				</div>
				<div className='flex items-center gap-2 text-slate-700'>
					<Calendar className='w-4 h-4 text-slate-500' />
					<span>
						{start} → {end}
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
