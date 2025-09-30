'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Bell, Check, ClipboardCheck, FileCheck2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

import {
	useGetNotificationsQuery,
	useMarkAllNotificationsReadMutation,
	useMarkNotificationReadMutation,
	notificationsApi,
} from '@/store/features/notifications/notificationsApi'
import {
	NotificationDto,
	NotificationType,
} from '@/store/features/notifications/notificationsTypes'

/** —————————————————————————————————————————————————————
 * Хелперы
 * ————————————————————————————————————————————————————— */
function labelByType(n: NotificationDto) {
	switch (n.type) {
		case NotificationType.TASK_ASSIGNED:
			return `Вас назначили исполнителем задачи${
				n.payload?.taskTitle ? `: «${n.payload.taskTitle}»` : ''
			}`
		case NotificationType.TASK_EVIDENCE_REQUESTED:
			return `Запрошены доказательства по задаче${
				n.payload?.taskTitle ? `: «${n.payload.taskTitle}»` : ''
			}${n.payload?.dueDate ? ` (до ${new Date(n.payload.dueDate).toLocaleDateString()})` : ''}`
		default:
			return 'Уведомление'
	}
}

function since(dateIso: string) {
	return formatDistanceToNow(new Date(dateIso), { addSuffix: true, locale: ru })
}

function mergeUnique(existing: NotificationDto[], incoming: NotificationDto[]) {
	const seen = new Set(existing.map((x) => x.id as any))
	const merged = [...existing]
	for (const n of incoming) if (!seen.has(n.id as any)) merged.push(n)
	return merged
}

/** —————————————————————————————————————————————————————
 * Карточка уведомления
 * ————————————————————————————————————————————————————— */
function NotificationItem({
	n,
	onMarkRead,
}: {
	n: NotificationDto
	onMarkRead: (id: NotificationDto['id']) => void
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
					<div className='mt-1 text-xs text-slate-500'>{since(n.created)}</div>
				</div>

				{!n.isRead && (
					<Button
						variant='ghost'
						size='icon'
						className='h-7 w-7 text-slate-500 hover:text-slate-800'
						onClick={() => onMarkRead(n.id)}
						title='Пометить прочитанным'
					>
						<Check className='h-4 w-4' />
					</Button>
				)}
			</div>
		</div>
	)
}

/** —————————————————————————————————————————————————————
 * Страница
 * ————————————————————————————————————————————————————— */
export default function NotificationsPage() {
	const { toast } = useToast()

	// 1) Первая страница + автопуллинг
	const {
		data: firstPage,
		isLoading: isLoadingFirst,
		isFetching: isFetchingFirst,
		refetch: refetchFirst,
	} = useGetNotificationsQuery(undefined, { pollingInterval: 15000 })

	// 2) Локальный стейт "все элементы" (аккумулируем страницы)
	const [items, setItems] = useState<NotificationDto[]>([])
	const [nextCursor, setNextCursor] = useState<string | null>(null)

	// 3) Подтягивание "следующей страницы" через lazy query
	const [fetchNext, { data: nextPageData, isFetching: isFetchingNext }] =
		notificationsApi.endpoints.getNotifications.useLazyQuery()

	// при изменении первой страницы — синхронизируем local items (без дублей)
	useEffect(() => {
		if (!firstPage) return
		setItems((prev) => mergeUnique(firstPage.items, prev))
		setNextCursor(firstPage.nextCursor ?? null)
	}, [firstPage])

	// при получении следующей страницы — аппендим
	useEffect(() => {
		if (!nextPageData) return
		setItems((prev) => mergeUnique(prev, nextPageData.items))
		setNextCursor(nextPageData.nextCursor ?? null)
	}, [nextPageData])

	// разделение на «непрочитанные» и «остальные»
	const unread = useMemo(() => items.filter((n) => !n.isRead), [items])
	const earlier = useMemo(() => items.filter((n) => n.isRead), [items])

	// 4) Маркировки
	const [markRead] = useMarkNotificationReadMutation()
	const [markAll, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation()

	const onMarkRead = async (id: NotificationDto['id']) => {
		try {
			await markRead(id).unwrap()
		} catch (e: any) {
			toast({
				title: 'Ошибка',
				description: 'Не удалось пометить уведомление',
				variant: 'destructive',
			})
		}
	}

	const onMarkAll = async () => {
		try {
			await markAll().unwrap()
			// локально тоже отметим всё прочитанным
			setItems((prev) =>
				prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
			)
		} catch (e: any) {
			toast({
				title: 'Ошибка',
				description: 'Не удалось пометить все уведомления',
				variant: 'destructive',
			})
		}
	}

	// 5) Бесконечная прокрутка через IntersectionObserver
	const sentinelRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!sentinelRef.current) return
		const el = sentinelRef.current
		const io = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (entry.isIntersecting && nextCursor && !isFetchingNext) {
					fetchNext({ before: nextCursor, limit: 20 })
				}
			},
			{ rootMargin: '300px 0px 0px 0px' }
		)
		io.observe(el)
		return () => io.unobserve(el)
	}, [nextCursor, isFetchingNext, fetchNext])

	const isEmpty = !isLoadingFirst && items.length === 0

	return (
		<div className=''>
			<Card className='shadow-sm'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0'>
					<CardTitle className='text-lg font-semibold flex items-center gap-2'>
						<Bell className='h-5 w-5 text-blue-600' />
						Уведомления
					</CardTitle>

					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => refetchFirst()}
							disabled={isFetchingFirst}
						>
							{isFetchingFirst ? (
								<span className='inline-flex items-center gap-2'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Обновление…
								</span>
							) : (
								'Обновить'
							)}
						</Button>

						<Button
							variant='secondary'
							size='sm'
							onClick={onMarkAll}
							disabled={isMarkingAll || items.every((n) => n.isRead)}
						>
							{isMarkingAll ? (
								<span className='inline-flex items-center gap-2'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Помечаю…
								</span>
							) : (
								'Пометить всё прочитанным'
							)}
						</Button>
					</div>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* Скелетоны при первом лоаде */}
					{isLoadingFirst && (
						<div className='space-y-2'>
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className='h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse'
								/>
							))}
						</div>
					)}

					{/* Пустое состояние */}
					{isEmpty && (
						<div className='h-48 flex flex-col items-center justify-center text-center text-slate-500'>
							<Bell className='h-8 w-8 mb-2' />
							<div className='text-sm'>Пока уведомлений нет</div>
						</div>
					)}

					{/* Недавние (непрочитанные) */}
					{unread.length > 0 && (
						<section className='space-y-3'>
							<div className='text-xs uppercase tracking-wide text-slate-500'>
								Недавние (непрочитанные)
							</div>
							<div className='space-y-2'>
								{unread.map((n) => (
									<NotificationItem key={n.id} n={n} onMarkRead={onMarkRead} />
								))}
							</div>
						</section>
					)}

					{/* Разделитель */}
					{(unread.length > 0 || earlier.length > 0) && <Separator />}

					{/* Все (прочитанные) */}
					{earlier.length > 0 && (
						<section className='space-y-3'>
							<div className='text-xs uppercase tracking-wide text-slate-500'>
								Все
							</div>
							<div className='space-y-2'>
								{earlier.map((n) => (
									<NotificationItem key={n.id} n={n} onMarkRead={onMarkRead} />
								))}
							</div>
						</section>
					)}

					{/* Сентинел для подгрузки следующих страниц */}
					{(nextCursor || isFetchingNext) && (
						<div className='py-4 flex items-center justify-center'>
							{isFetchingNext ? (
								<div className='inline-flex items-center gap-2 text-slate-500 text-sm'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Загрузка…
								</div>
							) : (
								<div ref={sentinelRef} className='h-1 w-1 opacity-0' />
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
