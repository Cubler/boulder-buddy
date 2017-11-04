let LOGIN = {
	name: null,
	userID: null,

	// Used to bypass facebook login
	BYPASS_NAME: 'Admin',
	BYPASS_USERID: '69420',

	// Handle race condition (database vs. Facebook API)
	fbReady: false,

	// Check facebook authentication status
	verify: () => {
		// Handle race condition where data from
		// database has loaded before the Facebook
		// API is ready.
		if (! LOGIN.fbReady) {
			$(window).on('LOGIN.fbReady', LOGIN.verify);
			return;
		}

		FB.getLoginStatus((response) => {
			if (response.status == 'connected') {
				let userID = response.authResponse.userID;
				let name = LOGIN.getName(userID);
				name.then(($name) => {
					LOGIN.authenticate($name, userID);
				});
			} else {
				let options = {};
				options.reset = true;
				NAV.transition('#login', options);
			}
		});
	},

	// Get Facebook name from logged in user id
	getName: (userID) => {
		return new Promise((resolve, reject) => {
			FB.api(userID, (response) => {
				resolve(response.name);
			});
		});
	},

	// Set authentication info and move to main menu
	authenticate: (name, userID) => {
		LOGIN.name = name;
		LOGIN.userID = userID;

		let options = {};
		options.reset = true;
		NAV.transition('#menu', options);
	},

	// Bypass facebook login
	bypass: () => {
		LOGIN.authenticate(LOGIN.BYPASS_NAME, LOGIN.BYPASS_USERID);
	},
};

// Called when the FB SDK is loaded
window.fbAsyncInit = () => {
	FB.init({
		appId      : '134015107210005',
		cookie     : true,
		xfbml      : true,
		version    : 'v2.10'
	});

	LOGIN.fbReady = true;
	$(window).trigger('LOGIN.fbReady');
};

// Load the facebook SDK
(function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
