
// npm -g i documentation
// # documentation build --config documentation.yml admin-client.js -f html -o api
// Note: don't upload CSS, else fix in S3
// Version should sync w/ mbake version due to -a

/**
 * Version v4.11.23
 */
console.log('ma-client-services', 'v4.11.23')

/**
* Login and logout to Meta Admin Service
* @example
	//const aa = new AdminAuth()
	AdminAuth.save('admin', '123')
	
	const  baseURL = 'http://localhost:9083'
	const aSrv = new MetaAdminService(baseURL, AdminAuth.username(), AdminAuth.secret())
*/
class AdminAuth {
	/**
	* @param username that you get from admin.yaml on server
	* @param secret that you get from admin.yaml on server
	*/
	static save(username, secret) {
		if (username)
			sessionStorage.setItem('maUsername', username)
		if (secret)
			sessionStorage.setItem('maAuth', secret)
	}

	static saveJwt(token) {
		if (token) 
			sessionStorage.setItem('jwtToken', token)
		else
			sessionStorage.removeItem('jwtToken')

	}

	static saveCurrentRole(currentRole) {
		if (currentRole) 
			sessionStorage.setItem('currentRole', currentRole)
		else
			sessionStorage.removeItem('currentRole')

	}

	static headers() {
		if (this.jwt()) {
			return { headers: { 'Authorization': `Bearer `+ this.jwt() }}
		}
		else 
			return {}
	}

	/**
	* @returns whether 
	*/
	static isLoggedIn() {
		return (sessionStorage.hasOwnProperty('maAuth') && sessionStorage.hasOwnProperty('maUsername'))
		|| sessionStorage.hasOwnProperty('jwtToken')
	}

	/**
	* @returns password used for MetaAdminService
	*/
	static secret() {
		return sessionStorage.getItem('maAuth')
	}
	/**
	* @returns username used for MetaAdminService
	*/
	static username() {
		return sessionStorage.getItem('maUsername')
	}

	/**
	* @returns JWT token used for MetaAdminService
	*/
	static jwt() {
		return sessionStorage.getItem('jwtToken')
	}
	/**
	* @returns JWT token used for MetaAdminService
	*/
	static currentRole() {
		return sessionStorage.getItem('currentRole')
	}
		
	/**
	* Clear, for logout
	*/
	static clear() {
		sessionStorage.removeItem('maAuth')
		sessionStorage.removeItem('maUsername')
		sessionStorage.removeItem('jwtToken')
		sessionStorage.removeItem('currentRole')
		try {
			delete window.aSrv
		} catch(err) { console.log(err) }
	}
}//()

/**
* Create new MetaAdminService instance. Each installation should be bespoke to the application it will admin.
* Needs Axios js loaded before).
* @returns MetaAdminService instance
* @param baseUrl - e.g. 'http://localhost:9083'
* @param username - e.g. 'admin'
* @param secret - e.g. '123'
* @example
*   depp.define('ma-client', '/admin-client.js')
*   depp.require(['ma-client'], function () {
*   const  baseURL = 'http://localhost:9083'
*   const aSrv = new MetaAdminService(baseURL, 'admin', 123')
*    aSrv.getLast().then(function(resp) {
*        console.log(resp.data)
*    }).catch(function (error) {
*        console.log(aSrv.getError(error))
*    })
*    })//ready
*/
class MetaAdminService {
	constructor(baseURL_, username, secret) {
		//console.log(secret) //function?
		if (AdminAuth.jwt())
		{
			this.service = axios.create({
				baseURL: baseURL_
				, headers: AdminAuth.headers() 
			})
		}
		else
		{
			if (username && secret)
				AdminAuth.save(username, secret)
			
			this.service = axios.create({
				baseURL: baseURL_
				, auth: {
					username: username,
					password: secret
				}
			})
		}

	}//cons

	/**
	* Gets the error
	* @returns error from the catch
	* @param error
	*/
	getError(error) {
		if (!error.response) return error
		if (error.response.data) return (error.response.data)
		return error.response.statusText
	}

	/**
	* Get the last message from the last executed command
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder folder - e.g. '/'
	*/
	getLast() {
		return this.service.get('/api/last', AdminAuth.headers())
	}
	/**
	* Returns a list of items in that folder (from dat_i.yaml)
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder folder - e.g. '/'
	*/
	getItems(folder) {
		let dir = '?folder='+folder
		return this.service.get('/api/items'+dir, AdminAuth.headers())
	}

	/**
	* Returns a list of users from the selected authorization (basic, firebase, future AWS Cognito)
	* @returns a promise, then(resp.dat)/catch{error}
	*/
	getUsers() {
		let arg = '?folder=team'
		return this.service.get('/api/users'+arg, AdminAuth.headers())
	}

	/**
	* Returns user info (from user uid folder)
	* @returns a promise, then(resp.dat)/catch{error}
	*/
	getUser(uid) {
		let arg = '?uid='+uid
		return this.service.get('/api/user'+arg, AdminAuth.headers())
	}

	/**
	* Does an mbake 'bake' in that folder
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder folder - e.g. '/'
	*/
	bake(folder) {
		let dir = '?folder='+folder
		return this.service.get('/api/bake'+dir, AdminAuth.headers())
	}
	/**
	* Does an mbake -t 'tag process' in that folder
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder folder - e.g. '/'
	*/
	tag(folder) {
		let dir = '?folder='+folder
		return this.service.get('/api/tag'+dir, AdminAuth.headers())
	}
	/**
	* Does an mbake -i 'itemize' from the mount
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder folder - e.g. '/blog'
	*/
	itemize(folder) {
		let dir = '?folder='+folder
		return this.service.get('/api/itemize'+dir, AdminAuth.headers() )
	}
	/**
	* Try to get title, image and desc of an url. Can be used for linkblog.
	* @returns a promise, then(resp.dat)/catch{error}
	* @param url - e.g. 'https://www.usatoday.com/sports/'
	*/
	scrape(url) {
		let arg = '?url='+btoa(url)
		return this.service.get('/api/scrape'+arg, AdminAuth.headers())
	}
	/**
	* Creates a new link blog item
	* @deprecated
	* @returns a promise, then(resp.dat)/catch{error}
	* @param src - e.g. '/blog/one'
	* @param dest - e.g. '/blog/newOne'
	* @param url - e.g. 'https://www.usatoday.com/sports/'
	* @param comment_ # in Markdown - e.g. 'This is an interesting article'
	* @param tags_ # CSV, eg: one, two
	*/
	newLinkBlog(src, dest, url, comment_, tags_) {
		let arg = '?url='+btoa(url)
		arg = arg + '&src=' + src
		arg = arg + '&dest=' + dest
		console.log(arg)

		return this.service.post('/api/newLinkBlog'+arg, {
				comment: comment_, tags: tags_
		}, AdminAuth.headers())
	}

	/**
	* Creates a new blog item
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder_ - e.g. '/blog - new item only uses parent folder
	* @param title_ -  e.g. 'My Title'
	* @param summary_ # markdown 'This article is about...'
	* @param content_ - # markdown content
	* @param date_published_ - e.g. '2019-07-21T22:38:16.944Z'
	* @param tags_ # CSV, eg: one, two
	* @param f1name_ - Featured image filename
	* @param f1_ - Featured image base64 encoded
	* @param fx_ # [{filename: myfilename, url: base64img}, ...] Array of files as JSON String
	*/
	newItem(folder_, title_, summary_, content_, date_published_, tags_, f1name_, f1_, fx_) {
		return this.service.post('/api/item', {
			 action: 'insert', folder: folder_, title: title_, summary: summary_, content: content_, 
			 date_published: date_published_, tags: tags_, 
			 f1name: f1name_, f1: f1_, fx: fx_
		}, AdminAuth.headers())
	}

	/**
	* Creates a new user on the file system, to track user currentRole
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder_ - useruid, used as folder
	* @param role_ -  e.g. 'Admin', 'Editor'
	* @param f1name_ - avatar filename
	* @param f1_ - avatar image base64 encoded
	*/
	newUser(folder_, role_, f1name_, f1_) {
		return this.service.post('/api/user', {
			action: 'insert', folder: folder_, role: role_, f1name: f1name_, f1: f1_
		}, AdminAuth.headers())
	}

	/**
	* Updates an existing blog item
	* @returns a promise, then(resp.dat)/catch{error}
	* @param folder_ - e.g. '/blog/my-first-blog'
	* @param title_ -  e.g. 'My Title'
	* @param summary_ # markdown 'This article is about...'
	* @param content_ - # markdown content
	* @param date_published_ - e.g. '2019-07-21T22:38:16.944Z'
	* @param tags_ # CSV, eg: one, two
	* @param f1name_ - Featured image filename
	* @param f1_ - Featured image base64 encoded or existing URL
	* @param fx_ # [{filename: myfilename, url: base64img or abs URL}, ...] Array of files as JSON String
	*/
	updateItem(folder_, title_, summary_, content_, date_published_, tags_, f1name_, f1_, fx_) {
		return this.service.post('/api/item', {
			 folder: folder_, title: title_, summary: summary_, content: content_, 
			 date_published: date_published_, tags: tags_, 
			 f1name: f1name_, f1: f1_, fx: fx_
		}, AdminAuth.headers())
	}


	/**
	* Clones a folder/screen. The cloned is set to 'publish: false' in dat.yaml.
	* @returns a promise, then(resp.dat)/catch{error}
	* @param src - e.g. '/blog/one'
	* @param dest - e.g. '/blog/newOne'
	*/
	clone(src, dest) {
		let arg = '?src=' + src
		arg = arg + '&dest=' + dest
		console.log(arg)
		return this.service.get('/api/clone'+arg, AdminAuth.headers())
	}

	/**
	* Removes an item from list, generates and returns the revised item list (items.json?).
	* @returns a promise, then(resp.dat)/catch{error}
	* @param listfolder - e.g. 'blog'
	* @param item - e.g. 'my-first-post', the item to be removed
	*/
	removeItem(listfolder, item) {
		if (item.indexOf('/')==0) item = item.substring(1) //cleanup
		if (item.indexOf(listfolder)==0) item = item.substring(listfolder.length-1)
		if (item.indexOf('/')==0) item = item.substring(1)
		let arg = '?listfolder=' + listfolder
		arg = arg + '&item=' + item
		console.log(arg)
		return this.service.get('/api/removeitem'+arg, AdminAuth.headers())
	}

	/**
	* Removes a user from list, generates and returns the revised item list (items.json?).
	* @returns a promise, then(resp.dat)/catch{error}
	* @param listfolder - e.g. 'team'
	* @param item - e.g. 'myuid', the item to be removed
	*/
	removeUser(listfolder, item) {
		let arg = '?listfolder=' + listfolder
		arg = arg + '&item=' + item
		console.log(arg)
		return this.service.get('/api/removeuser'+arg, AdminAuth.headers())
	}

	/**
	* Removes an item from list, generates and returns the revised item list (items.json?).
	* @returns a promise, then(resp.dat)/catch{error}
	* @param listfolder - e.g. 'blog'
	* @param item - e.g. 'my-first-post', the item to be removed
	*/
	getItem(path) {
		return this.service.get('/api/item?path='+path, AdminAuth.headers())
	}

}//class

/**
* Connect the user, based on saved cookie
@param URL of service
@returns a promise
@example
	 connect(baseURL).then(function() {//ok
			console.log('Lxxx yes')
	 }, function() {//rejected
			console.log('LXXX no')
	 })
*/
function connect(url) {
	return new Promise(function(resolve, reject) {
		console.log('connect')
		if (AdminAuth.isLoggedIn()) {
				console.log('is logged in. window.aSrv')
				const  baseURL = url
				window.aSrv = new MetaAdminService(baseURL, AdminAuth.username(), AdminAuth.secret()) //only needed with basic auth
				


				window.aSrv.getLast().then(function(resp) {
					console.log(resp.data)
					resolve()
				}).catch(function (error) {
					console.log(error)
					console.log(window.aSrv.getError(error))
					reject()
				})
		} else //if no cookie
				reject()
	 }) // pro
}//()

