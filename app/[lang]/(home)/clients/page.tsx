'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, Building, Edit, Eye, LayoutGrid, Plus, Table, User, Users } from 'lucide-react'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import AddClientModal from '@/components/Modals/AddClientModal'

interface IPropsPage {}
const Page: React.FC<IPropsPage> = () => {
	const [clients, setClients] = useState([])
	const [isAddClientModalOpen, setAddClientModalOpen] = useState(false)

	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-4xl font-bold text-slate-800 mb-3'>ניהול לקוחות</h1>
					<p className='text-xl text-slate-600'>נהל את רשימת הלקוחות והקשרים שלך</p>
				</div>
				<Button
					onClick={() => setAddClientModalOpen(true)}
					className='bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg'
				>
					<Plus className='ml-2 h-5 w-5' />
					הוסף לקוח חדש
				</Button>
			</div>

			{/* Clients Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>לקוחות פעילים</p>
								<p className='text-2xl font-bold text-slate-900'>
									{clients.filter((c) => c.status === 'active').length}
								</p>
							</div>
							<Users className='h-8 w-8 text-green-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>לקוחות פרטיים</p>
								<p className='text-2xl font-bold text-slate-900'>
									{clients.filter((c) => c.clientType === 'individual').length}
								</p>
							</div>
							<User className='h-8 w-8 text-blue-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>חברות</p>
								<p className='text-2xl font-bold text-slate-900'>
									{clients.filter((c) => c.clientType === 'business').length}
								</p>
							</div>
							<Building className='h-8 w-8 text-purple-600' />
						</div>
					</CardContent>
				</Card>

				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-lg'>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-slate-600'>סה"כ לקוחות</p>
								<p className='text-2xl font-bold text-slate-900'>
									{clients.length}
								</p>
							</div>
							<LayoutGrid className='h-8 w-8 text-indigo-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Clients List */}
			{clients.length > 0 ? (
				<Card className='bg-white/70 backdrop-blur-sm border-0 shadow-xl'>
					<CardHeader>
						<CardTitle className='text-2xl font-bold text-slate-800'>
							רשימת לקוחות
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow className='bg-slate-50/50'>
										<TableHead className='font-bold text-slate-700'>
											שם
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											סוג
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											אימייל
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											טלפון
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											סטטוס
										</TableHead>
										<TableHead className='font-bold text-slate-700'>
											פעולות
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{clients.map((client) => (
										<TableRow key={client.id} className='hover:bg-blue-50/30'>
											<TableCell className='font-semibold text-slate-800'>
												{client.name}
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className={
														client.clientType === 'business'
															? 'bg-purple-100 text-purple-700 border-purple-200'
															: 'bg-blue-100 text-blue-700 border-blue-200'
													}
												>
													{client.clientType === 'business'
														? 'עסק'
														: 'פרטי'}
												</Badge>
											</TableCell>
											<TableCell className='text-slate-600'>
												{client.email}
											</TableCell>
											<TableCell className='text-slate-600'>
												{client.phone || 'לא צוין'}
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className='bg-green-100 text-green-700 border-green-200'
												>
													פעיל
												</Badge>
											</TableCell>
											<TableCell>
												<div className='flex gap-2'>
													<Button variant='outline' size='sm'>
														<Eye className='h-4 w-4' />
													</Button>
													<Button variant='outline' size='sm'>
														<Edit className='h-4 w-4' />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className='text-center py-20'>
					<Users className='h-24 w-24 text-slate-300 mx-auto mb-6' />
					<h2 className='text-2xl font-bold text-slate-800 mb-4'>אין לקוחות עדיין</h2>
					<p className='text-lg text-slate-600 mb-8'>התחל בהוספת הלקוח הראשון שלך</p>
				</div>
			)}

			<AddClientModal
				isOpen={isAddClientModalOpen}
				onClose={() => setAddClientModalOpen(false)}
			/>
		</div>
	)
}

export default Page
