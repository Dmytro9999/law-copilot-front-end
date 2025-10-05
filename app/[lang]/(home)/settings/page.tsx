'use client'

import TwoFAToggle from '@/components/settings/TwoFAToggle'

export default function SettingsPage() {
	return (
		<div className='p-6 space-y-6'>
			<h1 className='text-2xl font-bold'>Settings</h1>
			<TwoFAToggle />
		</div>
	)
}
