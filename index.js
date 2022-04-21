const express = require('express')
const http = require('http')
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const axios = require('axios')
const io = require('socket.io')()
require('dotenv/config')

let visitors = {
	hosts: {},
	urls: {},
	custom: {}
}

let online = {
	hosts: {},
	urls: {}
}

if (process.env.DB_URL && process.env.DB_API_KEY) {
	axios({
		url: process.env.DB_URL,
		method: 'GET',
		headers: { 'x-apikey': process.env.DB_API_KEY }
	}).then((r) => {
		const resp = JSON.parse(r.data.data.data)
		if (Array.isArray(resp) || !resp.hosts || !resp.urls) throw resp
		visitors.hosts = resp.hosts || {}
		visitors.urls = resp.urls || {}
		visitors.custom = resp.custom || {}
	}).catch(console.error).finally(start)
}
else start()

function backupData() {
	if (process.env.NODE_ENV === 'development') return

	axios({
		url: process.env.DB_URL,
		method: 'PUT',
		headers: {
			'content-type': 'application/json',
			'x-apikey': process.env.DB_API_KEY
		},
		data: { data: { data: JSON.stringify(visitors) } }
	}).catch(console.error)
}

setInterval(backupData, 5 * 60 * 1000)

function start() {
	io.attach(server, {
		cors: {
			origin: '*'
		}
	})
	server.listen(process.env.PORT || 3000, () => {
		console.log('Servidor iniciado')
	})
}

io.on('connection', (socket) => {
	// URL, Host e IP do cliente
	let url, host
	try { url = new URL(socket.handshake.headers.origin || socket.handshake.headers.referer) } catch { }
	if (url) {
		url.pathname = socket.handshake.query.path || ''
		host = url.host
		url = url.toString()
	}
	const userIP =
		ip(socket.handshake && socket.handshake.headers && socket.handshake.headers['x-forwarded-for']) ||
		ip(socket.handshake && socket.handshake.headers && socket.handshake.headers['x-real-ip']) ||
		ip(socket.handshake && socket.handshake.address) ||
		ip(socket.conn && socket.conn.remoteAddress) ||
		ip(socket.request && socket.request.connection && socket.request.connection.remoteAddress) ||
		ip(socket.request && socket.request.connection && socket.request.connection._peername && socket.request.connection._peername.address) ||
		'0.0.0.0'

	if (url && host) {
		socket.join([url, host])

		// Contador de visitantes do Host e do URL
		const visitorsHost = visitors.hosts[host] = visitors.hosts[host] || []
		const visitorsURL = visitors.urls[url] = visitors.urls[url] || []
		const onlineHost = online.hosts[host] = online.hosts[host] || []
		const onlineURL = online.urls[url] = online.urls[url] || []

		// Envia a quantidade atual para o cliente conectado
		socket.emit('visitors.host.all', visitorsHost.length)
		socket.emit('visitors.host.online', onlineHost.length)
		socket.emit('visitors.url.all', visitorsURL.length)
		socket.emit('visitors.url.online', onlineURL.length)

		if (userIP && socket.handshake.headers.dnt !== '1') {
			// Inclui o cliente na lista do Host
			if (!visitorsHost.includes(userIP)) {
				visitorsHost.push(userIP)
				io.to(host).emit('visitors.host.all', visitorsHost.length)
			}

			// Inclui o cliente na lista online do Host
			if (!onlineHost.includes(socket)) {
				onlineHost.push(socket)
				io.to(host).emit('visitors.host.online', onlineHost.length)
			}

			// Inclui o cliente na lista do URL
			if (!visitorsURL.includes(userIP)) {
				visitorsURL.push(userIP)
				io.to(url).emit('visitors.url.all', visitorsURL.length)
			}

			// Inclui o cliente na lista online do URL
			if (!onlineURL.includes(socket)) {
				onlineURL.push(socket)
				io.to(url).emit('visitors.url.online', onlineURL.length)
			}
		}

		socket.on('disconnect', () => {
			// Retorna o índice do IP do cliente online
			const hostIdx = onlineHost.indexOf(socket)
			const urlIdx = onlineURL.indexOf(socket)

			// Remove o IP do cliente da lista online do Host
			if (hostIdx > -1) {
				onlineHost.splice(hostIdx, 1)
				io.to(host).emit('visitors.host.online', onlineHost.length)
			}

			// Remove o IP do cliente da lista online do URL
			if (urlIdx > -1) {
				onlineURL.splice(urlIdx, 1)
				io.to(url).emit('visitors.url.online', onlineURL.length)
			}
		})
	} else {
		socket.disconnect()
	}
})

app.use(cors())

if (process.env.NODE_ENV === 'development') app.get('/script.js', (req, res) => {
	res.sendFile('script.js', { root: '.' })
})

app.get('/script.min.js', (req, res) => {
	res.sendFile('script.min.js', { root: '.' })
})

app.get('/', (req, res) => {
	if (process.env.NODE_ENV === 'development') {
		res.sendFile('api.html', { root: '.' })
	} else {
		res.sendFile('api.min.html', { root: '.' })
	}
})

app.get('/visitors', (req, res) => {
	const url = req.headers.referer
	let host
	try { host = new URL(url).host } catch { }
	const userIP =
		ip(req.headers['x-forwarded-for']) ||
		ip(req.socket && req.socket.remoteAddress) ||
		ip(req.connection && req.connection.remoteAddress) ||
		'0.0.0.0'

	if (url && host) {
		// Contador de visitantes do Host e do URL
		const visitorsHost = visitors.hosts[host] = visitors.hosts[host] || []
		const visitorsURL = visitors.urls[url] = visitors.urls[url] || []
		const onlineHost = online.hosts[host] = online.hosts[host] || []
		const onlineURL = online.urls[url] = online.urls[url] || []

		if (userIP && req.headers.dnt !== '1') {
			// Inclui o cliente na lista do Host
			if (!visitorsHost.includes(userIP)) {
				visitorsHost.push(userIP)
				io.to(host).emit('visitors.host.all', visitorsHost.length)
			}

			// Inclui o cliente na lista do URL
			if (!visitorsURL.includes(userIP)) {
				visitorsURL.push(userIP)
				io.to(url).emit('visitors.url.all', visitorsURL.length)
			}
		}

		res.json({
			host: { all: visitorsHost.length, online: onlineHost.length },
			url: { all: visitorsURL.length, online: onlineURL.length }
		})
	} else {
		res.sendStatus(400)
	}
})

// Contador personalizado
app.get('/custom/:id/count.svg', (req, res) => {
	const PRIMARY_COLOR = escapeHTML(req.query.primaryColor || '#ff7b00')
	const SECONDARY_COLOR = escapeHTML(req.query.secondaryColor || '#ffa200')
	const TEXT_COLOR = escapeHTML(req.query.textColor || '#ffffff')
	let MIN_DIGITS = parseInt(req.query.minDigits) || 5
	if (MIN_DIGITS < 1 || MIN_DIGITS > 20) MIN_DIGITS = 5
	visitors.custom[req.params.id] = visitors.custom[req.params.id] || 0
	const VISITORS = ++visitors.custom[req.params.id]

	const number = VISITORS.toString().padStart(MIN_DIGITS, 0).split('')

	let svg = `<svg width="${number.length * 40}" height="40" xmlns="http://www.w3.org/2000/svg"><g>`

	for (const [i, digit] of Object.entries(number)) {
		const color = +i % 2 ? PRIMARY_COLOR : SECONDARY_COLOR

		svg += `<rect x="${+i * 40}" y="0" fill="${color}"></rect>`
		svg += `<g class="digit" style="--translate:-${+digit * 40}px;">`

		for (let j = 0; j < 10; j++) {
			svg += `<text x="${+i * 40 + 20}" y="${j * 40 + 22}">${j}</text>`
		}

		svg += '</g>'
	}

	svg += `</g><style>rect{width:40px;height:40px}.digit{transform:translateY(var(--translate));animation:anim 2s ease}text{dominant-baseline:middle;text-anchor:middle;font-size:2rem;font-family:Consolas,monospace,sans-serif;fill:${TEXT_COLOR};user-select:none}@keyframes anim{from{transform:translateY(0)}to{transform:translateY(var(--translate))}}</style></svg>`
	res.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
	res.contentType('image/svg+xml').send(svg)
})

// Acesso à páginas do administrador
app.use('/admin', (req, res, next) => {
	const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
	const auth = Buffer.from(b64auth, 'base64').toString().split(':')
	const [login, password] = auth

	if (login && password && process.env.ADMINS) {
		try {
			const admins = JSON.parse(process.env.ADMINS)
			if (admins[login] === password) {
				return next()
			}
		} catch { }
	}

	res.set('WWW-Authenticate', 'Basic realm="É necessária uma autenticação para acessar esta página"')
	res.status(401).send('Atualize a página para se autenticar')
})

app.get('/admin/visitors', (req, res) => {
	res.json(visitors)
})

app.get('/admin/online', (req, res) => {
	res.json({
		hosts: Object.entries(online.hosts).reduce((acc, val) => {
			acc[val[0]] = val[1].length
			return acc
		}, {}),
		urls: Object.entries(online.urls).reduce((acc, val) => {
			acc[val[0]] = val[1].length
			return acc
		}, {})
	})
})

app.get('/admin/test', (req, res) => {
	res.json({
		dburl: process.env.DB_URL,
		key: process.env.DB_API_KEY
	})
})

app.use((req, res, next) => {
	res.status(404).send('404 NOT FOUND')
})

app.use((error, req, res, next) => {
	res.status(500).send('500 INTERNAL SERVER ERROR')
})

// Retorna o IP se ele for válido, caso contrário retorna false
function ip(ipAddress) {
	if (!ipAddress) return false
	if (ipAddress === '::1') return false
	return ipAddress
}

// Escapa caracteres do HTML
function escapeHTML(html) {
	return html
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

process.on('uncaughtException', console.error)