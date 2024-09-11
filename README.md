# JD Visitor Counter - API
## How to add a counter to your HTML page
Insert this sample code on your website:
```html
<div>Host All: <span class="host-all">-</span></div>
<div>Host Online: <span class="host-online">-</span></div>
<div>URL All: <span class="url-all">-</span></div>
<div>URL Online: <span class="url-online">-</span></div>

<script src="https://jd-visitor-counter.onrender.com/script.min.js" async></script>
<script>
  window.addEventListener('load', () => {
    if ('VisitorCounter' in window) VisitorCounter({
      elements: {
        hostAll: '.host-all',
        hostOnline: '.host-online',
        urlAll: '.url-all',
        urlOnline: '.url-online'
      }
    })
  })
</script>
```
> Note: If the user's browser has "Do Not Track" enabled, it will not be counted

## Types of counters
* `hostAll`: Counts people who have **visited** any page on the **domain**
* `hostOnline`: Only counts people who are **online** on any page of the **domain**
* `urlAll`: Counts people who have only **visited** this site **page**
* `urlOnline`: Count people who are **online** on this **page** of the site

## `VisitorCounter`
```javascript
VisitorCounter(options)
```

### `options`
* `elements`: _object_

	Selectors where the counter numbers will appear
	* `hostAll`: _string_ (CSS selectors)
	* `hostOnline`: _string_ (CSS selectors)
	* `urlAll`: _string_ (CSS selectors)
	* `urlOnline`: _string_ (CSS selectors)
	
	_Example:_
	```javascript
	{
	  elements: {
	    hostAll: '.host-all',
	    hostOnline: '#host-online, .online',
	    urlAll: '.url-all .users',
	    urlOnline: 'span.url-online'
	  }
	}
	```

* `onUpdate`: _object_

	Run a function when updating the data
	* `hostAll`: _function_
	* `hostOnline`: _function_
	* `urlAll`: _function_
	* `urlOnline`: _function_

	_Example:_
	```javascript
	{
	  onUpdate: {
	    hostAll: (n) => console.log(n),
	    hostOnline: updateOnlineUsersCounter,
	    urlAll: function (numberOfUsers) {
			document.querySelector('.url-all').innerText = numberOfUsers
		},
	    urlOnline: console.log
	  }
	}
	```

* `onLoad`: _function_

	Execute a function when loading the counter
	
	_Example:_
	```javascript
	{
	  onLoad: function () {
	    alert('Counter loaded!')
	  }
	}
	```
* `doNotUseWebSocket`: _boolean_

	Does not use WebSocket to update data in real time
	**Default**: `false`

	_Example:_
	```javascript
	{
	  doNotUseWebSocket: true
	}
	```

## Full example
```javascript
VisitorCounter({
  elements: {
    hostAll: '.host-all',
    hostOnline: '#host-online, .online',
    urlAll: '.url-all .users',
    urlOnline: 'span.url-online'
  },

  onUpdate: {
    hostAll: (n) => console.log(n),
    hostOnline: updateOnlineUsersCounter,
    urlAll: function (numberOfUsers) {
      document.querySelector('.url-all').innerText = numberOfUsers
    },
    urlOnline: console.log
  },

  onLoad: function () {
    alert('Counter loaded!')
  },

  doNotUseWebSocket: true
})
```

## Custom counter
This returns an animated SVG image with the amount of visitors

Useful for putting on GitHub or pages that don't allow scripting

**GET** `https://jd-visitor-counter.onrender.com/custom/<id>/count.svg`

`<id>` Any string

![Visitor counter](https://jd-visitor-counter.onrender.com/custom/JDVisitorCounter/count.svg)

_Example for GitHub:_
```markdown
![Visitor counter](https://jd-visitor-counter.onrender.com/custom/github:YOURUSERNAME/count.svg)
```
### Customizations
Customize the counter through query parameters

* `primaryColor`: _string_ (CSS color)

	Change the background color of the primary boxes

* `secondaryColor`: _string_ (CSS color)

	Change the background color of the secondary boxes

* `textColor`: _string_ (CSS color)

	Change text color

* `minDigits`: _number_

	Minimum number of digits to be displayed (min. 1 / max. 20)

_Examples:_
* `https://jd-visitor-counter.onrender.com/custom/foo/count.svg?primaryColor=red`
* `https://jd-visitor-counter.onrender.com/custom/foo/count.svg?primaryColor=red&secondaryColor=green&textColor=yellow&minDigits=10`
* `https://jd-visitor-counter.onrender.com/custom/foo/count.svg?primaryColor=%23ff0000`
	> Note: To use hash character (`#`) use `%23` instead

---
<sub>Developed by Jefferson Dantas</sub>