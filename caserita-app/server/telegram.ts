/**
 * Bot de Telegram de Caserita: por aquí nos llega cada comprobante de pago
 * con los botones "Aceptar" y "Rechazar", igual que en Yoboleo.
 *
 * Variables: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (el chat de quien verifica),
 * TELEGRAM_WEBHOOK_SECRET (cualquier texto; Telegram lo devuelve en cada
 * llamada al webhook y así nadie más puede inventar aceptaciones).
 */

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN ?? ''
const CHAT = () => process.env.TELEGRAM_CHAT_ID ?? ''

export const telegramConfigurado = () => Boolean(TOKEN() && CHAT())

/** Última descripción de error que devolvió Telegram, para diagnosticar desde la API. */
export let ultimoError = ''

async function llamar(metodo: string, cuerpo: BodyInit, json = true): Promise<Record<string, unknown>> {
  if (!TOKEN()) return { ok: false, description: 'Telegram sin configurar' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/${metodo}`, {
      method: 'POST',
      headers: json ? { 'Content-Type': 'application/json; charset=utf-8' } : undefined,
      body: cuerpo,
    })
    const r = (await res.json()) as Record<string, unknown>
    if (!r.ok) {
      console.error(`[telegram] ${metodo}:`, JSON.stringify(r).slice(0, 300))
      ultimoError = String(r.description ?? `HTTP ${res.status}`)
    }
    return r
  } catch (e) {
    console.error(`[telegram] ${metodo} falló:`, e)
    ultimoError = e instanceof Error ? e.message : String(e)
    return { ok: false }
  }
}

export interface Botones {
  inline_keyboard: { text: string; callback_data?: string; url?: string }[][]
}

export async function enviarMensaje(texto: string, botones?: Botones): Promise<number | null> {
  const r = await llamar(
    'sendMessage',
    JSON.stringify({ chat_id: CHAT(), text: texto, parse_mode: 'HTML', reply_markup: botones }),
  )
  const m = r.result as { message_id?: number } | undefined
  return m?.message_id ?? null
}

/** Manda la foto del comprobante tal cual la subió el cliente. */
export async function enviarFoto(
  bytes: Uint8Array,
  mime: string,
  nombre: string,
  leyenda: string,
  botones?: Botones,
): Promise<{ messageId: number | null; fileId: string | null }> {
  const form = new FormData()
  form.append('chat_id', CHAT())
  form.append('caption', leyenda)
  form.append('parse_mode', 'HTML')
  if (botones) form.append('reply_markup', JSON.stringify(botones))
  form.append('photo', new Blob([bytes.buffer as ArrayBuffer], { type: mime }), nombre)
  const r = await llamar('sendPhoto', form, false)
  const m = r.result as { message_id?: number; photo?: { file_id: string }[] } | undefined
  const fotos = m?.photo ?? []
  return { messageId: m?.message_id ?? null, fileId: fotos.length ? fotos[fotos.length - 1].file_id : null }
}

export async function responderCallback(id: string, texto: string): Promise<void> {
  await llamar('answerCallbackQuery', JSON.stringify({ callback_query_id: id, text: texto }))
}

/** Quita los botones de un mensaje ya atendido para que no se toque dos veces. */
export async function quitarBotones(chatId: string | number, messageId: number): Promise<void> {
  await llamar(
    'editMessageReplyMarkup',
    JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
  )
}

export async function registrarWebhook(url: string, secreto: string): Promise<Record<string, unknown>> {
  return llamar(
    'setWebhook',
    JSON.stringify({ url, secret_token: secreto, allowed_updates: ['callback_query', 'message'] }),
  )
}

export async function infoWebhook(): Promise<Record<string, unknown>> {
  return llamar('getWebhookInfo', JSON.stringify({}))
}

/** Nombre del bot al que pertenece el token (para ver que las variables estén bien). */
export async function quienSoy(): Promise<string> {
  const r = await llamar('getMe', JSON.stringify({}))
  const u = r.result as { username?: string } | undefined
  return u?.username ? '@' + u.username : 'token inválido: ' + (ultimoError || '?')
}

/** Comprueba que el bot pueda escribirle al chat configurado. */
export async function pruebaChat(): Promise<string> {
  const r = await llamar('getChat', JSON.stringify({ chat_id: CHAT() }))
  const c = r.result as { first_name?: string; title?: string; username?: string } | undefined
  return c ? `ok: ${c.first_name ?? c.title ?? ''} ${c.username ? '@' + c.username : ''}`.trim() : `chat ${CHAT()} no accesible: ${ultimoError || '?'}`
}

export function hora(ms = Date.now()): string {
  return new Date(ms).toLocaleString('es-BO', { timeZone: 'America/La_Paz', hour12: false })
}
