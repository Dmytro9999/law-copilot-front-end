'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};


export default function AuthCard({ title, subtitle, children }: Props) {
    return (
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-slate-800">{title}</CardTitle>
                {subtitle && <p className="text-slate-600 text-sm">{subtitle}</p>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
