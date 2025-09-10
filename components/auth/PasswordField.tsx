'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useI18n } from '@/providers/I18nProvider'

type Props = {
	value: string
	onChange: (v: string) => void
	id?: string
	label?: string
	required?: boolean
	helper?: string
}

export default function PasswordField({
	value,
	onChange,
	id = 'password',
	label,
	required = true,
	helper,
}: Props) {
	const [show, setShow] = useState(false)
	const { t } = useI18n()

	const finalLabel = t('auth.login.password.label')
	const aria = show ? t('password.hide') : t('password.show')

	return (
		<div className='space-y-2'>
			<Label htmlFor={id} className='text-sm font-semibold text-slate-700'>
				{finalLabel}
			</Label>
			<div className='relative'>
				<Lock className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
				<Input
					id={id}
					type={show ? 'text' : 'password'}
					placeholder='••••••••'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className='h-12 pr-10 pl-12 bg-white/70 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
					required={required}
				/>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					className='absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8'
					onClick={() => setShow((s) => !s)}
					aria-label={aria}
					title={aria}
				>
					{show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
				</Button>
			</div>
			{helper && <p className='text-xs text-slate-500'>{helper}</p>}
		</div>
	)
}
