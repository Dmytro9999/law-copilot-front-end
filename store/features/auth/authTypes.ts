// SignUp
export interface ISignUpData {
	lawFirm: string
	name: string
	email: string
	password: string
	phone?: string
}

export interface ISignUpResponse {
	data: {
		createdUser: {
			id: string
			email: string
			role: string
			firstName: string
			lastName: string
			username: string
		}
	}
	message: string
}

// Login
export interface ILoginData {
	email: string
	password: string
}

export type ILoginResponse = IUser | ITwoFaChallenge

export interface IUser {
	data: {
		user: {
			_id: string
			userRole: string
		}
		tokens: {
			accessToken: string
			refreshToken: string
		}
	}
}

// Refresh
export interface IRefreshData {
	refreshToken: string
}

export interface IRefreshResponse {
	data: {
		accessToken: string
		refreshToken: string
	}
}

// Logout
export interface ILogoutData {
	refreshToken: string
}

export interface ILogoutResponse {
	message: string
	status?: number
}

// ConfirmEmail
export interface IConfirmEmailData {
	token: string
}

export interface IConfirmEmailResponse {
	data: {
		user: {
			email: string
			firstName: string
			lastName: string
			username: string
			status: string
			_id: string
		}
	}
	message: string
}

// ResendConfirmEmail
export interface IResendConfirmEmailData {
	email: string
}

export interface IResendConfirmEmailResponse extends ISignUpResponse {}

// ResetPasswordSendEmail
export interface IResetPasswordSendEmailData {
	email: string
}

export interface IResetPasswordSendEmailResponse {
	message: string
	status?: number
}

// ResetPasswordUpdatePassword
export interface IResetPasswordUpdatePasswordData {
	password: string
	confirmPassword: string
	token: string
}

export interface IResetPasswordUpdatePasswordResponse {
	message: string
	status?: number
}

export interface ITwoFaChallenge {
	requires2fa: true
	twoFaToken: string
}

export type UserResp = { id: number; email: string; two_factor_enabled: boolean }
export type TwoFaResp = {
	requires2fa: true
	twoFaToken: string
	ttlSec?: number
	cooldownSec?: number
	maskedEmail?: string
}

export enum RolesEnum {
	ADMIN = 'admin',
	LAWYER = 'lawyer',
	CLIENT = 'client',
}
export interface Role {
	id: number
	name: string
	slug: RolesEnum
}

export interface CurrentUser {
	id: number | string
	name: string
	email: string
	roles: Role[]
}
export type RoleSlug = 'admin' | 'lawyer' | 'client'

export type UserMinimal = {
	id: number | string
	roles: RoleSlug[]
} | null
