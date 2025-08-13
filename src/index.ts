const BOT_TOKEN = process.env.BOT_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

if (!BOT_TOKEN) {
	console.error('BOT_TOKEN is required')
	throw new Error('BOT_TOKEN is required')
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
	const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup, parse_mode: 'HTML', disable_web_page_preview: true }),
	})
	return res
}

function buildStartMessage() {
	const hasAppUrl = Boolean(APP_URL)
	const text = '👋 <b>Добро пожаловать в Peer Swap</b>\n\nМаркетплейс для покупок и продаж. Управляйте товарами и заказами в одном месте.\n\nНажмите кнопку ниже, чтобы открыть мини‑приложение.'
	const replyMarkup = hasAppUrl ? { inline_keyboard: [[{ text: 'Открыть Peer Swap', web_app: { url: APP_URL } }]] } : undefined
	return { text, replyMarkup }
}

async function handleUpdate(update: any) {
	const message = update.message || update.edited_message
	if (!message) return
	const chatId = message.chat?.id
	const text = message.text as string | undefined
	if (!chatId) return
	if (text && text.startsWith('/start')) {
		const { text: welcomeText, replyMarkup } = buildStartMessage()
		await sendMessage(chatId, welcomeText, replyMarkup)
	}
}

async function deleteWebhook() {
	await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ drop_pending_updates: true }),
	})
}

async function startPolling() {
	let lastUpdateId = 0
	for (;;) {
		const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ timeout: 50, offset: lastUpdateId + 1, allowed_updates: ['message', 'edited_message'] }),
		})
		const data = await resp.json().catch(() => null)
		if (!data || !data.ok) continue
		for (const update of data.result as any[]) {
			if (typeof update.update_id === 'number' && update.update_id > lastUpdateId) lastUpdateId = update.update_id
			await handleUpdate(update)
		}
	}
}


(async () => {
	await deleteWebhook()
	startPolling()
})()
console.log('Bot polling started')

