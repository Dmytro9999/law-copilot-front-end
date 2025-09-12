'use client'

import React, { useState } from 'react'
import AddContractModal from '@/components/Modals/AddContractModal'
import { Button } from '@/components/ui/button'
import {
	useAnalyzeContractMutation,
	useMaterializeContractMutation,
	useUploadDocumentMutation,
} from '@/store/features/contracts/contractsApi'

const Page = () => {
	const [isAddModalOpen, setAddModalOpen] = useState(false)

	const [uploadDocument] = useUploadDocumentMutation()
	const [analyzeContract] = useAnalyzeContractMutation()
	const [materializeContract] = useMaterializeContractMutation()

	const handleAddContract = async (contractForm: {
		name: string
		clientName: string
		clientEmail: string
		clientPhone?: string
		clientId?: string
		signingDate: string
		contractType?: string
		value?: string
		file: File | null
	}) => {}

	return (
		<div>
			<Button onClick={() => setAddModalOpen(true)}>Modal</Button>
			HELLO
			<AddContractModal
				isOpen={isAddModalOpen}
				onClose={() => setAddModalOpen(false)}
				onSave={handleAddContract}
			/>
		</div>
	)
}

export default Page

//
//
// "use client"
//
// import { useAuth } from "@/components/auth/auth-provider"
// import LoginForm from "@/components/auth/login-form"
// import ContractPilotApp from "@/components/contract-pilot-app"
// import { Brain } from "lucide-react"
//
// export default function Page() {
//     const { user, loading } = useAuth()
//
//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-slate-50 via-blue-50 to-indigo-100">
//                 <div className="flex flex-col items-center gap-4">
//                     <div className="relative">
//                         <Brain className="h-12 w-12 text-blue-600 animate-pulse" />
//                         <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>
//                     </div>
//                     <p className="text-slate-600 font-medium">טוען מערכת LAWCOPILOT...</p>
//                     <div className="flex gap-1">
//                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
//                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
//                         <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
//                     </div>
//                 </div>
//             </div>
//         )
//     }
//
//     if (!user) {
//         return <div>hello </div>
//     }
//
//     return <ContractPilotApp />
// }
//
//
//
// ВСЕ ЧТО ВЫШЕ НАДО ВЫНЕСТИ НАВЕРНОЕ создать папку (home)  и там уже page где будет ContractPilotApp, лодер вынести глобально тоже как то
