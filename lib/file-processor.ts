// lib/file-processor.ts
// Клиент теперь НЕ парсит сам — отправляет файл на бэк и получает text + metadata.
// Возвращаем тот же интерфейс ProcessedFile, чтобы не ломать остальной код.

export interface ProcessedFile {
	text: string
	metadata: {
		fileName: string
		fileSize: number
		fileType: string
		pageCount?: number
		wordCount: number
		extractedAt: string
	}
	chunks: TextChunk[]
}

export interface TextChunk {
	id: string
	text: string
	startIndex: number
	endIndex: number
	type: 'paragraph' | 'header' | 'list' | 'table'
	confidence: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api').replace(
	/\/+$/,
	''
)

// Главная функция: отправляем файл на /documents/extract-text
export async function processFile(file: File): Promise<ProcessedFile> {
	const fd = new FormData()
	fd.append('file', file)

	const res = await fetch(`${API_BASE}/documents/extract-text`, {
		method: 'POST',
		body: fd,
		credentials: 'include',
	})

	if (!res.ok) {
		const msg = await safeMessage(res)
		throw new Error(msg || 'Server text extraction failed')
	}

	const { text, metadata } = await res.json()

	if (!text || !String(text).trim()) {
		throw new Error('Empty text after extraction')
	}

	return {
		text,
		metadata,
		chunks: splitIntoChunks(text),
	}
}

// опционально можно оставить для UX предварительную проверку
export function isSupportedFile(_: File): boolean {
	// Теперь доверяем бэку; но можно ограничить размер на клиенте.
	return true
}

function splitIntoChunks(text: string): TextChunk[] {
	const chunks: TextChunk[] = []
	const maxChunkSize = 1200
	const overlap = 120

	const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

	let current = ''
	let chunkIndex = 0
	let startIndex = 0

	for (const p of paragraphs) {
		if (current.length + p.length > maxChunkSize && current.length > 0) {
			chunks.push({
				id: `chunk-${chunkIndex}`,
				text: current.trim(),
				startIndex,
				endIndex: startIndex + current.length,
				type: detectChunkType(current),
				confidence: 0.9,
			})

			const overlapText = current.slice(-overlap)
			startIndex += current.length - overlapText.length
			current = overlapText + '\n' + p
			chunkIndex++
		} else {
			current += (current ? '\n' : '') + p
		}
	}

	if (current.trim()) {
		chunks.push({
			id: `chunk-${chunkIndex}`,
			text: current.trim(),
			startIndex,
			endIndex: startIndex + current.length,
			type: detectChunkType(current),
			confidence: 0.9,
		})
	}

	return chunks
}

function detectChunkType(text: string): 'paragraph' | 'header' | 'list' | 'table' {
	if (text.length < 100 && (/^[A-Za-zА-Яа-яЁёא-ת\d.\s-]+$/.test(text) || /^\d+\./.test(text))) {
		return 'header'
	}
	if (
		/^[\d\u2022\u2023\u25E6\u25AA\u25AB-]/.test(text) ||
		text.includes('\n• ') ||
		text.includes('\n- ')
	) {
		return 'list'
	}
	if ((text.match(/\t/g) || []).length > 3 || (text.match(/\|/g) || []).length > 3) {
		return 'table'
	}
	return 'paragraph'
}

async function safeMessage(res: Response) {
	try {
		const j = await res.json()
		return j?.message || j?.error || res.statusText
	} catch {
		return res.statusText
	}
}
