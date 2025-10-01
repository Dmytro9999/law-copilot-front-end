'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow, Locale } from 'date-fns'
import { he, enUS } from 'date-fns/locale'
import {
	Bell,
	Check,
	ClipboardCheck,
	FileCheck2,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

import {
	useGetNotificationsQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
} from '@/store/features/notifications/notificationsApi'
import {
	NotificationDto,
	NotificationType,
} from '@/store/features/notifications/notificationsTypes'
import { useI18n, useLocale } from '@/providers/I18nProvider'

function labelByTypeFactory(t: (k: string) => string, lang: 'he' | 'en') {
	const quote = (s?: string) => (s ? `: «${s}»` : '')
	const fmtUntil = (iso?: string) => {
		if (!iso) return ''
		const d = new Date(iso)
		const dt = new Intl.DateTimeFormat(lang).format(d)
		return ` (${t('notifications.types.until')} ${dt})`
	}
	return (n: NotificationDto) => {
		switch (n.type) {
			case NotificationType.TASK_ASSIGNED:
				return `${t('notifications.types.taskAssignedPrefix')}${quote(n.payload?.taskTitle)}`
			case NotificationType.TASK_EVIDENCE_REQUESTED:
				return `${t('notifications.types.taskEvidencePrefix')}${quote(n.payload?.taskTitle)}${fmtUntil(n.payload?.dueDate)}`
			default:
				return t('notifications.types.default')
		}
	}
}

function since(iso: string, dfnsLoc: Locale) {
	return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: dfnsLoc })
}

function NotificationItem({
	n,
	onMarkRead,
	labelByType,
	dfnsLocale,
	t,
}: {
	n: NotificationDto
	onMarkRead: (id: NotificationDto['id']) => void
	labelByType: (n: NotificationDto) => string
	dfnsLocale: Locale
	t: (k: string) => string
}) {
	const Icon = n.type === NotificationType.TASK_ASSIGNED ? ClipboardCheck : FileCheck2
	return (
		<div
			className={[
				'rounded-lg border p-3 transition',
				n.isRead
					? 'bg-white/60 dark:bg-slate-900/40'
					: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200',
			].join(' ')}
		>
			<div className='flex items-start gap-3'>
				<div className='mt-0.5'>
					<Icon
						className={['h-5 w-5', n.isRead ? 'text-slate-400' : 'text-blue-600'].join(
							' '
						)}
					/>
				</div>

				<div className='flex-1'>
					<div className='text-sm text-slate-800 dark:text-slate-100'>
						{labelByType(n)}
					</div>
					<div className='mt-1 text-xs text-slate-500'>
						{since(n.created, dfnsLocale)}
					</div>
				</div>

				{!n.isRead && (
					<Button
						variant='ghost'
						size='icon'
						className='h-7 w-7 text-slate-500 hover:text-slate-800'
						onClick={() => onMarkRead(n.id)}
						title={t('notifications.markReadTitle')}
						aria-label={t('notifications.markReadTitle')}
					>
						<Check className='h-4 w-4' />
					</Button>
				)}
			</div>
		</div>
	)
}

export default function NotificationsPage() {
	const { toast } = useToast()
	const { t } = useI18n()
	const lang = useLocale() as 'he' | 'en'
	const dfnsLocale = lang === 'he' ? he : enUS

	const [cursorStack, setCursorStack] = useState<Array<string | null>>([null])
	const [pageIndex, setPageIndex] = useState(0)
	const currentCursor = cursorStack[pageIndex] ?? undefined

	const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(
		{ before: currentCursor, limit: 20 },
		{ pollingInterval: pageIndex === 0 ? 15000 : 0 }
	)
	const unread = useMemo(() => (data?.items ?? []).filter((n) => !n.isRead), [data])
	const earlier = useMemo(() => (data?.items ?? []).filter((n) => n.isRead), [data])

	const [markRead] = useMarkNotificationReadMutation()
	const [markAll, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()

	const onMarkRead = async (id: NotificationDto['id']) => {
		try {
			await markRead(id).unwrap()
		} catch {
			toast({
				title: t('notifications.toast.errorTitle'),
				description: t('notifications.toast.markOneFail'),
				variant: 'destructive',
			})
		}
	}
	const onMarkAll = async () => {
		try {
			await markAll().unwrap()
		} catch {
			toast({
				title: t('notifications.toast.errorTitle'),
				description: t('notifications.toast.markAllFail'),
				variant: 'destructive',
			})
		}
	}

	const onRefresh = async () => {
		setCursorStack([null])
		setPageIndex(0)
		await refetch()
	}

	const canNext = Boolean(data?.nextCursor)
	const onNext = () => {
		if (!data?.nextCursor) return
		// если шли назад и затем вперёд — обрезаем «хвост»
		const head = cursorStack.slice(0, pageIndex + 1)
		setCursorStack([...head, data.nextCursor])
		setPageIndex((i) => i + 1)
	}

	const canPrev = pageIndex > 0
	const onPrev = () => {
		if (!canPrev) return
		setPageIndex((i) => i - 1)
	}

	const isEmpty = !isLoading && (data?.items.length ?? 0) === 0

	const labelByType = labelByTypeFactory(t, lang)

	return (
		<Card className='shadow-sm'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0'>
				<CardTitle className='text-lg font-semibold flex items-center gap-2'>
					<Bell className='h-5 w-5 text-blue-600' />
					{t('notifications.title')}
				</CardTitle>

				<div className='flex items-center gap-2'>
					{/*<Button variant='outline' size='sm' onClick={onRefresh} disabled={isFetching}>
            {isFetching ? (
              <span className='inline-flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {t('notifications.markingAll')}
              </span>
            ) : (
              'Обновить'
            )}
          </Button>*/}

					<Button
						variant='outline'
						size='sm'
						onClick={onMarkAll}
						disabled={isMarkingAll || (data?.items ?? []).every((n) => n.isRead)}
					>
						{isMarkingAll ? (
							<span className='inline-flex items-center gap-2'>
								<Loader2 className='h-4 w-4 animate-spin' />
								{t('notifications.markingAll')}
							</span>
						) : (
							t('notifications.markAll')
						)}
					</Button>
				</div>
			</CardHeader>

			<CardContent className='space-y-6'>
				{isLoading && (
					<div className='space-y-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className='h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse'
							/>
						))}
					</div>
				)}

				{isEmpty && (
					<div className='h-48 flex flex-col items-center justify-center text-center text-slate-500'>
						<Bell className='h-8 w-8 mb-2' />
						<div className='text-sm'>{t('notifications.empty')}</div>
					</div>
				)}

				{unread.length > 0 && (
					<section className='space-y-3'>
						<div className='text-xs uppercase tracking-wide text-slate-500'>
							{t('notifications.groups.unread')}
						</div>
						<div className='space-y-2'>
							{unread.map((n) => (
								<NotificationItem
									key={n.id}
									n={n}
									onMarkRead={onMarkRead}
									labelByType={labelByType}
									dfnsLocale={dfnsLocale}
									t={t}
								/>
							))}
						</div>
					</section>
				)}

				{(unread.length > 0 || earlier.length > 0) && <Separator />}

				{earlier.length > 0 && (
					<section className='space-y-3'>
						<div className='text-xs uppercase tracking-wide text-slate-500'>
							{t('notifications.groups.all')}
						</div>
						<div className='space-y-2'>
							{earlier.map((n) => (
								<NotificationItem
									key={n.id}
									n={n}
									onMarkRead={onMarkRead}
									labelByType={labelByType}
									dfnsLocale={dfnsLocale}
									t={t}
								/>
							))}
						</div>
					</section>
				)}

				<div className='pt-2 flex items-center justify-between'>
					<Button variant='outline' size='sm' onClick={onPrev} disabled={!canPrev}>
						<ChevronLeft className='h-4 w-4 mr-1' /> {t('notifications.paginate.prev')}
					</Button>

					<div className='text-xs text-slate-500'>
						{t('notifications.paginate.page')} {pageIndex + 1}
					</div>

					<Button variant='outline' size='sm' onClick={onNext} disabled={!canNext}>
						{t('notifications.paginate.next')} <ChevronRight className='h-4 w-4 ml-1' />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
