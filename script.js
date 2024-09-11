function VisitorCounter(options = {}) {
	if (typeof options !== 'object') {
		throw new Error('"options" must be an object')
	}

	if (typeof options.elements !== 'object') {
		options.elements = {}
	}

	const nodes = {
		hostAll: options.elements.hostAll ? document.querySelectorAll(options.elements.hostAll) : [],
		hostOnline: options.elements.hostOnline ? document.querySelectorAll(options.elements.hostOnline) : [],
		urlAll: options.elements.urlAll ? document.querySelectorAll(options.elements.urlAll) : [],
		urlOnline: options.elements.urlOnline ? document.querySelectorAll(options.elements.urlOnline) : []
	}

	if (typeof options.onUpdate !== 'object') {
		options.onUpdate = {}
	}

	options.onUpdate.hostAll = options.onUpdate.hostAll || function () { }
	options.onUpdate.hostOnline = options.onUpdate.hostOnline || function () { }
	options.onUpdate.urlAll = options.onUpdate.urlAll || function () { }
	options.onUpdate.urlOnline = options.onUpdate.urlOnline || function () { }

	const visitors = { host: { all: 0, online: 0 }, url: { all: 0, online: 0 } }

	if (!options.doNotUseWebSocket) {
		const $socketIO = document.createElement('script')
		$socketIO.onload = () => {
			const socket = io('https://jd-visitor-counter.onrender.com', {
				query: {
					path: location.pathname
				}
			})

			if (typeof options.onLoad === 'function') {
				socket.on('connect', options.onLoad)
			}

			socket.on('visitors.host.all', updateVisitorsHostAll)
			socket.on('visitors.url.all', updateVisitorsUrlAll)
			socket.on('visitors.host.online', updateVisitorsHostOnline)
			socket.on('visitors.url.online', updateVisitorsUrlOnline)
			socket.on('connect_error', () => {})
		}
		$socketIO.src = 'https://jd-visitor-counter.onrender.com/socket.io/socket.io.min.js'
		document.body.appendChild($socketIO)
	} else {
		fetch('https://jd-visitor-counter.onrender.com/visitors')
			.then(r => { if (!r.ok) throw r; return r.json() })
			.then(r => {
				if (typeof options.onLoad === 'function') {
					options.onLoad()
				}

				updateVisitorsHostAll(r.host.all)
				updateVisitorsUrlAll(r.url.all)
				updateVisitorsHostOnline(r.host.online)
				updateVisitorsUrlOnline(r.url.online)
			})
	}

	function updateVisitorsHostAll(n) {
		visitors.host.all = n
		options.onUpdate.hostAll(n)
		nodes.hostAll.forEach(el => el.innerText = n)
	}

	function updateVisitorsUrlAll(n) {
		visitors.url.all = n
		options.onUpdate.urlAll(n)
		nodes.urlAll.forEach(el => el.innerText = n)
	}

	function updateVisitorsHostOnline(n) {
		visitors.host.online = n
		options.onUpdate.hostOnline(n)
		nodes.hostOnline.forEach(el => el.innerText = n)
	}

	function updateVisitorsUrlOnline(n) {
		visitors.url.online = n
		options.onUpdate.urlOnline(n)
		nodes.urlOnline.forEach(el => el.innerText = n)
	}
}