'use client'
import React, { useState } from 'react'
import { AlertTriangle, Calendar, CheckSquare, Edit, Eye, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import MeetingSummaryModal from '@/components/Modals/MeetingSummaryModal'

interface IPropsPage {}
const Page: React.FC<IPropsPage> = () => {
	const [isMeetingSummaryModalOpen, setMeetingSummaryModalOpen] = useState(false)

	const [meetings, setMeetings] = useState<any>([])
	const contracts = []
	return (
		<div>
			<div className='space-y-8'>
				{/* Meeting Summaries Header */}
				<div className='flex justify-between items-center'>
					<div>
						<h3 className='text-2xl font-bold text-slate-800 mb-2'>סיכומי פגישות</h3>
						<p className='text-slate-600'>מעקב אחר כל הפגישות והחלטות שהתקבלו</p>
					</div>
					<Button
						onClick={() => setMeetingSummaryModalOpen(true)}
						className='bg-gradient-to-l from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3'
					>
						<Plus className='ml-2 h-5 w-5' />
						פגישה חדשה
					</Button>
				</div>

				{/* Meeting Summaries Grid */}
				{meetings.length === 0 ? (
					<Card className='p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200'>
						<MessageSquare className='mx-auto h-16 w-16 text-slate-400 mb-4' />
						<h3 className='text-xl font-semibold text-slate-700 mb-2'>
							אין סיכומי פגישות עדיין
						</h3>
						<p className='text-slate-500 mb-6'>
							התחל לתעד פגישות עם לקוחות ויצירת סיכומים חכמים
						</p>
						<Button
							onClick={() => setMeetingSummaryModalOpen(true)}
							className='bg-gradient-to-l from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
						>
							<Plus className='ml-2 h-4 w-4' />
							צור סיכום פגישה ראשון
						</Button>
					</Card>
				) : (
					<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{meetings.map((meeting) => (
							<Card
								key={meeting.id}
								className='p-6 hover:shadow-lg transition-all duration-200 border-slate-200 bg-white'
							>
								<div className='space-y-4'>
									{/* Meeting Header */}
									<div className='flex justify-between items-start'>
										<div className='flex-1'>
											<h4 className='font-semibold text-slate-800 text-lg mb-1'>
												פגישה -{' '}
												{new Date(meeting.meeting_date).toLocaleDateString(
													'he-IL'
												)}
											</h4>
											<p className='text-sm text-slate-500'>
												{meeting.participants?.join(', ') ||
													'לא צוינו משתתפים'}
											</p>
										</div>
										<Badge variant='outline' className='text-xs'>
											{meeting.contract_id ? 'קשור לחוזה' : 'כללי'}
										</Badge>
									</div>

									{/* Meeting Summary */}
									<div className='space-y-3'>
										<div>
											<h5 className='font-medium text-slate-700 mb-2'>
												סיכום:
											</h5>
											<p className='text-sm text-slate-600 line-clamp-3'>
												{meeting.summary || 'אין סיכום זמין'}
											</p>
										</div>

										{/* AI Insights Preview */}
										{meeting.ai_insights && (
											<div className='space-y-2'>
												{meeting.ai_insights.mainTopics &&
													meeting.ai_insights.mainTopics.length > 0 && (
														<div>
															<h6 className='text-xs font-medium text-slate-600 mb-1'>
																נושאים עיקריים:
															</h6>
															<div className='flex flex-wrap gap-1'>
																{meeting.ai_insights.mainTopics
																	.slice(0, 3)
																	.map((topic, index) => (
																		<Badge
																			key={index}
																			variant='secondary'
																			className='text-xs'
																		>
																			{topic}
																		</Badge>
																	))}
																{meeting.ai_insights.mainTopics
																	.length > 3 && (
																	<Badge
																		variant='secondary'
																		className='text-xs'
																	>
																		+
																		{meeting.ai_insights
																			.mainTopics.length - 3}
																	</Badge>
																)}
															</div>
														</div>
													)}

												{meeting.ai_insights.actionItems &&
													meeting.ai_insights.actionItems.length > 0 && (
														<div>
															<h6 className='text-xs font-medium text-slate-600 mb-1'>
																פעולות נדרשות:
															</h6>
															<p className='text-xs text-slate-500'>
																{
																	meeting.ai_insights.actionItems
																		.length
																}{' '}
																משימות נוצרו
															</p>
														</div>
													)}

												{meeting.ai_insights.riskLevel && (
													<div>
														<h6 className='text-xs font-medium text-slate-600 mb-1'>
															רמת סיכון:
														</h6>
														<Badge
															variant={
																meeting.ai_insights.riskLevel ===
																'גבוה'
																	? 'destructive'
																	: meeting.ai_insights
																				.riskLevel ===
																		  'בינוני'
																		? 'default'
																		: 'secondary'
															}
															className='text-xs'
														>
															{meeting.ai_insights.riskLevel}
														</Badge>
													</div>
												)}
											</div>
										)}
									</div>

									{/* Meeting Actions */}
									<div className='flex justify-between items-center pt-3 border-t border-slate-100'>
										<div className='text-xs text-slate-400'>
											נוצר:{' '}
											{new Date(meeting.created_at).toLocaleDateString(
												'he-IL'
											)}
										</div>
										<div className='flex gap-2'>
											<Button
												variant='ghost'
												size='sm'
												className='text-xs h-8 px-3'
												onClick={() => {
													// TODO: Implement view meeting details
													toast({
														title: 'צפייה בפרטים',
														description: 'פונקציונליות זו תתווסף בקרוב',
													})
												}}
											>
												<Eye className='ml-1 h-3 w-3' />
												צפה
											</Button>
											<Button
												variant='ghost'
												size='sm'
												className='text-xs h-8 px-3'
												onClick={() => {
													// TODO: Implement edit meeting
													toast({
														title: 'עריכה',
														description: 'פונקציונליות זו תתווסף בקרוב',
													})
												}}
											>
												<Edit className='ml-1 h-3 w-3' />
												ערוך
											</Button>
										</div>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}

				{/* Meeting Statistics */}
				{meetings.length > 0 && (
					<div className='grid gap-4 md:grid-cols-4'>
						<Card className='p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-blue-700'>סה"כ פגישות</p>
									<p className='text-2xl font-bold text-blue-800'>
										{meetings.length}
									</p>
								</div>
								<MessageSquare className='h-8 w-8 text-blue-600' />
							</div>
						</Card>

						<Card className='p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-green-700'>
										פגישות החודש
									</p>
									<p className='text-2xl font-bold text-green-800'>
										{
											meetings.filter((m) => {
												const meetingDate = new Date(m.meeting_date)
												const now = new Date()
												return (
													meetingDate.getMonth() === now.getMonth() &&
													meetingDate.getFullYear() === now.getFullYear()
												)
											}).length
										}
									</p>
								</div>
								<Calendar className='h-8 w-8 text-green-600' />
							</div>
						</Card>

						<Card className='p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-purple-700'>
										משימות נוצרו
									</p>
									<p className='text-2xl font-bold text-purple-800'>
										{meetings.reduce((total, meeting) => {
											return (
												total +
												(meeting.ai_insights?.actionItems?.length || 0)
											)
										}, 0)}
									</p>
								</div>
								<CheckSquare className='h-8 w-8 text-purple-600' />
							</div>
						</Card>

						<Card className='p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-orange-700'>
										סיכון גבוה
									</p>
									<p className='text-2xl font-bold text-orange-800'>
										{
											meetings.filter(
												(m) => m.ai_insights?.riskLevel === 'גבוה'
											).length
										}
									</p>
								</div>
								<AlertTriangle className='h-8 w-8 text-orange-600' />
							</div>
						</Card>
					</div>
				)}
			</div>

			<MeetingSummaryModal
				isOpen={isMeetingSummaryModalOpen}
				onClose={() => setMeetingSummaryModalOpen(false)}
				//onSaveSummary={()=>{addMeetingSummary}}
				onSaveSummary={() => {}}
				contracts={contracts}
			/>
		</div>
	)
}

export default Page
