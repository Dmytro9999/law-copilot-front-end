'use client';
import { Brain, Sparkles } from 'lucide-react';


export default function AuthBrand() {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
                <div className="relative">
                    <Brain className="h-12 w-12 text-blue-600" />
                    <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Law copilot
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">AI Legal Assistant</p>
                </div>
            </div>
            <p className="text-slate-600">המערכת המשפטית החכמה הראשונה בישראל</p>
        </div>
    );
}
