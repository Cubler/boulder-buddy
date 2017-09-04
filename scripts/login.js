let LOGIN = {
	name: null,
	userID: null,

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
			let options = {};
			options.reset = true;

			if (response.status == 'connected') {
				let userID = response.authResponse.userID;
				let name = LOGIN.getName(userID);
				name.then(($name) => {
					LOGIN.name = $name;
					LOGIN.userID = userID;
					NAV.transition('#menu', options);
				});

			} else {
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
	js.src = "http://connect.facebook.net/en_US/sdk.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
