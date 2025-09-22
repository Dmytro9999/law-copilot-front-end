'use client'

import { useState } from 'react'
import { AlertTriangle, Edit2, Save, X, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/providers/I18nProvider'
import { cn } from '@/lib/utils'

type Props = {
	risks: string[]
	onChange: (next: string[]) => void
	className?: string
}

export default function ContractRisksEditor({ risks, onChange, className }: Props) {
	const { t } = useI18n()

	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editValue, setEditValue] = useState('')
	const [newValue, setNewValue] = useState('')

	const startEdit = (i: number) => {
		setEditingIndex(i)
		setEditValue(risks[i] ?? '')
	}
	const cancelEdit = () => {
		setEditingIndex(null)
		setEditValue('')
	}
	const saveEdit = () => {
		if (editingIndex === null) return
		const v = editValue.trim()
		const next = [...risks]
		next[editingIndex] = v || ''
		onChange(next)
		setEditingIndex(null)
		setEditValue('')
	}
	const addRisk = () => {
		const v = newValue.trim()
		if (!v) return
		onChange([...(risks || []), v])
		setNewValue('')
	}
	const removeRisk = (i: number) => {
		const next = risks.filter((_, idx) => idx !== i)
		onChange(next)
	}

	return (
		<div className={cn('bg-red-50 p-4 rounded-lg border border-red-200', className)}>
			<h4 className='font-semibold text-red-800 mb-3 flex items-center gap-2'>
				<AlertTriangle className='h-4 w-4' />
				{t('risks.title') || 'סיכונים שזוהו'} ({risks?.length || 0})
			</h4>

			<div className='space-y-2 max-h-60 overflow-y-auto'>
				{(!risks || risks.length === 0) && (
					<div className='text-sm text-red-700/80'>
						{t('risks.empty') || 'אין סיכונים'}
					</div>
				)}

				{risks?.map((risk, i) => {
					const isEditing = editingIndex === i
					return (
						<div key={i} className='bg-white/70 p-3 rounded border border-red-200'>
							{!isEditing ? (
								<div className='flex items-start justify-between gap-2'>
									<div className='text-sm text-red-800'>{risk}</div>
									<div className='flex items-center gap-1'>
										<Button
											variant='outline'
											size='sm'
											className='h-8 bg-white'
											onClick={() => startEdit(i)}
											title={t('risks.edit') || 'ערוך'}
										>
											<Edit2 className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='h-8 bg-white text-red-700 border-red-300 hover:bg-red-50'
											onClick={() => removeRisk(i)}
											title={t('risks.delete') || 'מחק'}
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								</div>
							) : (
								<div className='flex items-start gap-2'>
									<Input
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										placeholder={t('risks.placeholder') || 'תאר את הסיכון...'}
										className='text-sm'
									/>
									<Button
										variant='outline'
										size='sm'
										className='h-8 text-green-700 border-green-300 hover:bg-green-50'
										onClick={saveEdit}
									>
										<Save className='h-4 w-4 mr-1' />
										{t('risks.save') || 'שמור'}
									</Button>
									<Button
										variant='outline'
										size='sm'
										className='h-8'
										onClick={cancelEdit}
									>
										<X className='h-4 w-4 mr-1' />
										{t('risks.cancel') || 'ביטול'}
									</Button>
								</div>
							)}
						</div>
					)
				})}
			</div>

			<div className='mt-4 pt-3 border-t border-red-200'>
				<div className='text-sm font-semibold text-red-800 mb-2'>
					{t('risks.addNew') || 'הוסף סיכון חדש'}
				</div>
				<div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2'>
					<Input
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						placeholder={t('risks.newPlaceholder') || 'כותרת / תיאור קצר'}
					/>
					<Button onClick={addRisk} disabled={!newValue.trim()} className='h-10'>
						<Plus className='h-4 w-4 mr-1' />
						{t('risks.add') || 'הוסף'}
					</Button>
				</div>
			</div>
		</div>
	)
}
