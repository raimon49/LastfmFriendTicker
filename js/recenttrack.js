/**
 * @fileOverview Last.fm recent track checker
 * @author <a href="mailto:raimon49@hotmail.com">raimon</a>
 */

/**
 * @class recent track check one user
 * @constructor
 * @param {String} id     The id of Last.fm user
 * @param {Number} check  check interval time(minute)
 */
var RecentTrack = function(id, check) {
	this.id = id;
	this.feed = "http://ws.audioscrobbler.com/1.0/user/" + id + "/recenttracks.rss";
	this.userPage = "http://www.last.fm/user/" + id;
	this.playingIcon = "http://cdn.last.fm/flatness/global/icon_eq.gif";
	this.userIcon = "http://usericons.relucks.org/lastfm/" + id;
	this.timer = null;

	this.minute     = 60 * 1000;
	this.MAX_MINUTE =  3;
	this.MIN_MINUTE =  1;
	this.TIMEOUT    = 5000;

	this.intervalTime;
	this.setIntervalTime(check);
	this.initialize();
}

/**
 * class initialize
 *
 * @private
 * @function
 */
RecentTrack.prototype.initialize = function() {
	var doc = document;
	var ticker = doc.getElementById(this.id);
	if (ticker) {
		var dl = doc.createElement("dl");
		dl.appendChild(this.createUser());
		dl.appendChild(this.createTrackContainer());
		ticker.appendChild(dl);
	}

	this.getLastTrack();
	this.startWatchingFeed();
};

/**
 * start feed check timer
 *
 * @private
 * @function
 */
RecentTrack.prototype.startWatchingFeed = function() {
	if (this.timer !== null) {
		clearTimeout(this.timer);
	}

	this.timer = setInterval(this.bindThis(this.getLastTrack), this.intervalTime);
};

/**
 * get feed and parse
 *
 * @private
 * @function
 */
RecentTrack.prototype.getLastTrack = function() {
	var self = this;
	var xhr = new XMLHttpRequest();
	var isLoaded = false;
	var showErrorMesssage = function(msg) {
		var doc = document;
		var trackContainer = doc.getElementById(self.id + "_track_contaienr");
		trackContainer.innerHTML = "<p style='color: red;'>" + msg.escapeHtml() + "</p>";
	};

	xhr.open("GET", this.feed + "?t=" + new Date().getTime());
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 ) {
			isLoaded = true;
			if (xhr.status === 200) {
				var res = xhr.responseXML;
				var result = self.parse(res);
				self.show(result);
			}
			else if (xhr.status === 404) {
				showErrorMesssage("User not found.");
				self.destruct();
			}

			xhr = null;
		}
	}

	xhr.send(null);
	var timeout = setTimeout(function() {
		if (!isLoaded) {
			xhr.abort();
			xhr = null;

			showErrorMesssage("Request timeout.");
		}
	}, this.TIMEOUT);
}

/**
 * bind scope and set custom parameters
 *
 * @private
 * @function
 * @param    {Function} func function
 * @return   {Function}      bind scope function
 */
RecentTrack.prototype.bindThis = function() {
	var self = this;
	var args = Array.prototype.slice.call(arguments);
	var func = args.shift();
	var f = function() {
		return func.apply(self, args);
	}

	return f;
}

/**
 * set timer interval time
 *
 * @public
 * @function
 * @param    {Number} time interval time(minute)
 */
RecentTrack.prototype.setIntervalTime = function(time) {
	var min = (time !== void 0) ? Number(time) : 2;

	if (isNaN(min) || min > this.MAX_MINUTE || min < this.MIN_MINUTE) {
		this.intervalTime = min * this.minute;
	}
	else {
		this.intervalTime = min * this.minute;
	}
}

/**
 * parse feed response
 *
 * @private
 * @function
 * @param    {Object} xml XMLHttpRequest responseXML
 * @return   {Object} parsed response summary
 */
RecentTrack.prototype.parse = function(xml) {
	var isNowPlaying = this.parsePlaying(xml);
	var recentTrack  = this.parseLastPlayTrack(xml);

	return {
		"user": this.id, 
		"playing": isNowPlaying, 
		"title": recentTrack
	};
}

/**
 * parse user playing
 *
 * @private
 * @function
 * @param    {Object}  xml XMLHttpRequest responseXML
 * @return   {boolean}     user playing => true
 */
RecentTrack.prototype.parsePlaying = function(xml) {
	var lastBuildDateSource = xml.getElementsByTagName("lastBuildDate");
	var lastBuildDate = (lastBuildDateSource[0]) ? lastBuildDateSource[0].firstChild.nodeValue : null;

	var items = xml.getElementsByTagName("item");
	var recentPlayDate = (items[0]) ? items[0].getElementsByTagName("pubDate")[0].firstChild.nodeValue : null;

	if (lastBuildDate && recentPlayDate) {
		return (new Date(lastBuildDate) < new Date(recentPlayDate));
	}
	else {
		return false;
	}

}

/**
 * param user last play track title
 *
 * @private
 * @function
 * @param    {Object}  xml XMLHttpRequest responseXML
 * @return   {String}      last play track title
 */
RecentTrack.prototype.parseLastPlayTrack = function(xml) {
	var items = xml.getElementsByTagName("item");
	var recentItem = (items[0]) ? items[0] : null;

	if (recentItem) {
		return recentItem.getElementsByTagName("title")[0].firstChild.nodeValue;
	}
	else {
		return "(Failed...)";
	}
}

/**
 * show last play track title and playing icon
 *
 * @private
 * @function
 * @param result {Object} parsed responseXML summary
 */
RecentTrack.prototype.show = function(result) {
	var doc = document;
	var trackContainer = doc.getElementById(this.id + "_track_contaienr");
	var contents = result.user;

	if (result.playing) {
		contents += "&nbsp;<img src='" + this.playingIcon + "' alt='now playing'>";
	}

	if (trackContainer) {
		var trackTitle = this.createTrackTitle(result.title);
		trackContainer.innerHTML = "";
		trackContainer.appendChild(trackTitle);

		var p = doc.getElementById(this.id + "_playing");
		if (result.playing) {
			p.innerHTML = "<img src='" + this.playingIcon + "' alt='now playing'>";
		}
		else {
			p.innerHTML = "";
		}
	}
}

/**
 * create DOM user icon and user name
 * 
 * @private
 * @function
 * @return {DOM} DT Element
 */
RecentTrack.prototype.createUser = function() {
	var doc = document;

	var icon = doc.createElement("img");
	icon.src = this.userIcon;
	icon.alt = this.id;
	icon.height = 12;
	icon.width = 12;

	var anchor = doc.createElement("a");
	var text = doc.createTextNode(this.id.escapeHtml());
	anchor.appendChild(text);
	anchor.href = this.userPage;

	var playing = doc.createElement("span");
	playing.id = this.id + "_playing";

	var container = doc.createElement("dt");
	container.appendChild(icon);
	container.appendChild(anchor);
	container.appendChild(playing);

	return container;
};

/**
 * create DOM track title box
 *
 * @private
 * @function
 * @return {DOM} DD Element
 */
RecentTrack.prototype.createTrackContainer = function() {
	var doc = document;
	var container = doc.createElement("dd");
	container.id = this.id + "_track_contaienr";

	return container;
};

/**
 * create DOM last play track title
 *
 * @private
 * @function
 * @param    {String} title track title
 * @return   {DOM}          P Element
 */
RecentTrack.prototype.createTrackTitle = function(title) {
	var doc = document;
	var container = doc.createElement("p");
	var scrollText = doc.createElement("marquee");
	var text = doc.createTextNode(title);

	scrollText.appendChild(text);
	scrollText.behavior = "scroll";
	scrollText.scrollAmount = 3;
	scrollText.loop = 1;
	scrollText.attachEvent("onfinish", this.bindThis(this.fitTrackTitle, title));

	container.id = this.id + "_track";
	container.appendChild(scrollText);

	return container;
};

/**
 * remove MARQUEE Element, append P Element for scrolling track title to fix
 *
 * @private
 * @function
 * @param    {String} title track title
 */
RecentTrack.prototype.fitTrackTitle = function(title) {
	var doc = document;
	var container = doc.getElementById(this.id + "_track");
	var fitText = doc.createElement("p");
	var style = fitText.style;
	var text = doc.createTextNode(title);

	fitText.appendChild(text);
	fitText.title = title;
	style.height = "24px";
	style.width = "125px";
	style.overflow = "hidden";

	if (container) {
		container.replaceChild(fitText, container.firstChild);
	}
};

/**
 * clear feed check timer
 * 
 * @public
 * @function
 */
RecentTrack.prototype.destruct = function() {
	clearTimeout(this.timer);
};
