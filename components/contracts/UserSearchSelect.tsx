'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { SimpleUser, useLazyQuickSearchUsersQuery } from '@/store/features/users/usersApi'

function useDebounced<T>(value: T, delay = 300) {
	const [v, setV] = React.useState(value)
	React.useEffect(() => {
		const id = setTimeout(() => setV(value), delay)
		return () => clearTimeout(id)
	}, [value, delay])
	return v
}

export default function UserSearchSelect({
	value,
	onChange,
	placeholder = 'Найти пользователя по email/имени…',
	limit = 8,
}: {
	value: SimpleUser | null
	onChange: (u: SimpleUser | null) => void
	placeholder?: string
	limit?: number
}) {
	const [q, setQ] = React.useState('')
	const dq = useDebounced(q, 300)
	const [open, setOpen] = React.useState(false)

	const [trigger, { data = [], isFetching }] = useLazyQuickSearchUsersQuery()

	React.useEffect(() => {
		let cancelled = false
		const run = async () => {
			if (!dq || dq.length < 2) return
			const p = trigger({ q: dq, limit })
			await p
			if (cancelled) return
		}
		run()
		return () => {
			cancelled = true
		}
	}, [dq, limit, trigger])

	return (
		<div className='relative'>
			{value ? (
				<div className='flex items-center justify-between gap-2 border rounded-md px-3 py-2 bg-white'>
					<div className='text-sm'>
						<div className='font-medium'>{value.name}</div>
						<div className='text-slate-500'>{value.email}</div>
					</div>
					<Button
						type='button'
						variant='outline'
						size='sm'
						className='text-red-600 border-red-300 hover:bg-red-50'
						onClick={() => onChange(null)}
					>
						Remove
					</Button>
				</div>
			) : (
				<input
					className='w-full border rounded-md px-3 py-2 text-sm'
					placeholder={placeholder}
					value={q}
					onChange={(e) => {
						setQ(e.target.value)
						setOpen(true)
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 150)}
				/>
			)}

			{open && !value && (isFetching || (dq && data.length >= 0)) && (
				<div className='absolute z-20 mt-1 w-full bg-white border rounded-md shadow-sm max-h-56 overflow-auto'>
					{isFetching && (
						<div className='px-3 py-2 text-sm text-slate-500'>searching…</div>
					)}
					{!isFetching && dq && data.length === 0 && (
						<div className='px-3 py-2 text-sm text-slate-500'>no found</div>
					)}
					{!isFetching &&
						data.map((u) => (
							<button
								key={u.id}
								type='button'
								className='w-full text-left px-3 py-2 hover:bg-slate-50'
								onClick={() => {
									onChange(u)
									setQ('')
									setOpen(false)
								}}
							>
								<div className='text-sm font-medium'>{u.name}</div>
								<div className='text-xs text-slate-500'>{u.email}</div>
							</button>
						))}
				</div>
			)}
		</div>
	)
}
