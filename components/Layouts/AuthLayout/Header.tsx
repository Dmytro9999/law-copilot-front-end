// components/layout/Header.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import authSelectors from '@/store/features/auth/authSelectors'
import { authApi, useLogoutMutation } from '@/store/features/auth/authApi'
import { resetAuth } from '@/store/features/auth/authSlice'
import LocaleSelect from '@/components/Layouts/LocaleSelect'
import { useLocale } from '@/providers/I18nProvider'
import { useState } from 'react'

type Stats = {
	activeContracts: number
	pendingObligations: number
	overdueObligations: number
	completedThisWeek: number
}

type Props = {
	onOpenSettings?: () => void
}

export default function Header({ onOpenSettings }: Props) {
	const [stats, setStats] = useState({
		activeContracts: 0,
		pendingObligations: 0,
		overdueObligations: 0,
		completedThisWeek: 0,
	})

	const user = useAppSelector(authSelectors.selectUser)

	const router = useRouter()
	const pathname = usePathname()
	const dispatch = useAppDispatch()
	const { toast } = useToast()
	const lang = useLocale()

	const title = (() => {
		if (pathname?.startsWith('/contracts')) return 'לוח בקרה ראשי'
		if (pathname?.startsWith('/tasks')) return 'ניהול משימות'
		if (pathname?.startsWith('/clients')) return 'ניהול לקוחות'
		if (pathname?.startsWith('/meetings')) return 'סיכומי פגישות ואנליטיקה'
		if (pathname?.startsWith('/notifications')) return 'מרכז התראות'
		if (pathname?.startsWith('/settings')) return 'הגדרות משתמש'
		return ''
	})()

	const subtitle = (() => {
		if (pathname?.startsWith('/contracts'))
			return 'ניהול חוזים והתחייבויות מתקדם עם Google Gemini AI + n8n'
		if (pathname?.startsWith('/tasks')) return 'ניהול משימות האישיות שלך'
		if (pathname?.startsWith('/clients')) return 'מעקב אחר לקוחות והתחייבויותיהם'
		if (pathname?.startsWith('/meetings'))
			return 'תיעוד פגישות, ניתוח נתונים ויצירת דוחות מתקדמים'
		if (pathname?.startsWith('/notifications')) return 'ניהול התראות ותזכורות אוטומטיות דרך n8n'
		if (pathname?.startsWith('/settings')) return 'ניהול פרופיל, אבטחה והעדפות מערכת'
		return ''
	})()

	const goNotifications = () => router.push('/notifications')
	const goSettings = () => (onOpenSettings ? onOpenSettings() : router.push('/settings'))
	const [logoutMutation] = useLogoutMutation()
	const handleSignOut = async () => {
		try {
			await logoutMutation().unwrap()
			dispatch(resetAuth())
			dispatch(authApi.util.resetApiState())
			router.push(`/${lang}/login`)
			toast({
				title: 'התנתקת בהצלחה',
				description: 'נתראה בפעם הבאה!',
				className: 'bg-blue-500 text-white',
			})
		} catch {
			toast({ title: 'שגיאה בהתנתקות', description: 'נסה שוב', variant: 'destructive' })
		}
	}

	return (
		<header className='h-24 px-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'>
			<div className='flex items-center justify-between h-full'>
				<div>
					<h2 className='text-3xl font-bold text-slate-800'>{title}</h2>
					<p className='text-lg text-slate-500'>{subtitle}</p>
				</div>

				<div className='flex items-center gap-5'>
					<LocaleSelect />
					<Button
						variant='ghost'
						size='icon'
						className='relative h-12 w-12'
						onClick={goNotifications}
						aria-label='התראות'
					>
						<Bell className='h-6 w-6' />
						<span className='absolute -top-1 -left-1 h-4 w-4 bg-red-500 rounded-full text-xs' />
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								className='relative h-14 w-14 rounded-full border-2 border-blue-300 hover:border-blue-400 transition-colors'
								aria-label='תפריט משתמש'
							>
								<Avatar className='h-12 w-12'>
									<AvatarImage
										src='/placeholder.svg?width=48&height=48'
										alt='@lawyer'
									/>
									<AvatarFallback className='bg-gradient-to-l from-blue-500 to-purple-500 text-white font-bold text-lg'>
										עד
									</AvatarFallback>
								</Avatar>
								<div className='absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full' />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className='w-80 p-3' align='end'>
							<DropdownMenuLabel className='font-normal p-5 bg-gradient-to-l from-blue-50 to-purple-50 rounded-lg mb-3'>
								<div className='flex flex-col space-y-3'>
									<p className='text-xl font-bold leading-none'>עו"ד דוד כהן</p>
									<p className='text-lg leading-none text-muted-foreground'>
										{/*david.cohen@lawfirm.co.il*/}
										{user?.email}
									</p>
									<div className='flex items-center gap-3 mt-3'>
										<Shield className='h-5 w-5 text-green-500' />
										<span className='text-lg text-green-600 font-medium'>
											חשבון מאומת
										</span>
									</div>
								</div>
							</DropdownMenuLabel>

							<DropdownMenuSeparator />

							<DropdownMenuItem
								className='p-5 cursor-pointer hover:bg-blue-50 rounded-lg'
								onClick={goSettings}
							>
								<Settings className='ml-4 h-6 w-6 text-blue-600' />
								<div className='flex flex-col'>
									<span className='font-medium text-lg'>הגדרות משתמש</span>
									<span className='text-sm text-slate-500'>
										פרופיל, אבטחה, התראות
									</span>
								</div>
							</DropdownMenuItem>

							<DropdownMenuItem
								className='p-5 cursor-pointer hover:bg-amber-50 rounded-lg'
								onClick={goNotifications}
							>
								<Bell className='ml-4 h-6 w-6 text-amber-600' />
								<div className='flex flex-col'>
									<span className='font-medium text-lg'>התראות</span>
									<span className='text-sm text-slate-500'>
										{stats?.overdueObligations ?? 0} התראות חדשות
									</span>
								</div>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem
								className='p-5 cursor-pointer hover:bg-red-50 rounded-lg text-red-600 font-medium'
								onClick={handleSignOut}
							>
								<LogOut className='ml-4 h-6 w-6' />
								<div className='flex flex-col'>
									<span className='text-lg'>התנתקות</span>
									<span className='text-sm text-red-500'>יציאה מהמערכת</span>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	)
}
