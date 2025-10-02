import ClientsPage from '@/app/[lang]/(home)/clients/ClientsPage'
import { guard } from '@/lib/rbac/pageGuard'

export default async function LoginPage() {
	await guard('clients.invite')
	return <ClientsPage />
}
