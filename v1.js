!(function () {
	try {
		var container = document.querySelector('#ipsLayout_body');
		var pageEnterTime;
		var interLinks = [];
		var maxScroll = window.scrollY;
		var scrollMetrics = {
			scrollStartPosition: 0,
			scrollStartTime: Date.now(),
			staticStartTime: Date.now(),
			viewPortStart: window.scrollY,
			viewPortEnd: window.innerHeight + window.scrollY,
		};
		window.apEuCountries = [
			'AT',
			'BE',
			'BG',
			'HR',
			'CY',
			'CZ',
			'DK',
			'EE',
			'FI',
			'FR',
			'DE',
			'GR',
			'HU',
			'IE',
			'IT',
			'LV',
			'LT',
			'LU',
			'MT',
			'NL',
			'PL',
			'PT',
			'RO',
			'SK',
			'SI',
			'ES',
			'SE',
			'GB',
			'GF',
			'GP',
			'MQ',
			'ME',
			'YT',
			'RE',
			'MF',
			'GI',
			'AX',
			'PM',
			'GL',
			'BL',
			'SX',
			'AW',
			'CW',
			'WF',
			'PF',
			'NC',
			'TF',
			'AI',
			'BM',
			'IO',
			'VG',
			'KY',
			'FK',
			'MS',
			'PN',
			'SH',
			'GS',
			'TC',
			'AD',
			'LI',
			'MC',
			'SM',
			'VA',
			'JE',
			'GG',
			'GI',
		];
		var highlighted = false;
		var userId, sessionId, pageId, sessionTime;
		var accessLocalStorage = true;
		var userIdKey = 'apRecommendationUserId';
		var sessionIdKey = 'apRecommendationSessionId';
		var sessionTimeKey = 'apRecommendationSessionTime';

		var isNewUser;
		var pageEnterTime;
		//check for tc string for GDPR countries
		function tcfCallback(tcData, success) {
			if (
				success &&
				(tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete')
			) {
				var consentObj = tcData.purpose.consents;
				for (c in consentObj) {
					if (!consentObj[c]) accessLocalStorage = false;
				}
				__tcfapi('removeEventListener', 2, function () {}, tcData.listenerId);
			} else {
				accessLocalStorage = false;
			}
		}

		function checkConsent(country) {
			if (window.apEuCountries.indexOf(country) !== -1) {
				if (__tcfapi) {
					__tcfapi('addEventListener', 2, tcfCallback);
				} else {
					accessLocalStorage = false;
				}
			}
		}

		///set userId and sessionId
		function init() {
			userId = window.localStorage.getItem(userIdKey);
			sessionId = window.localStorage.getItem(sessionIdKey);
			sessionTime = window.localStorage.getItem(sessionTimeKey);
			isNewUser = false;

			pageId = window.apRecommendationPageId;
			pageEnterTime = new Date().getTime();
			var isSameSession = true;

			if (!userId) {
				adpushup.utils.log('no userId');
				userId = createUUID();
				window.localStorage.setItem(userIdKey, userId);

				isNewUser = true;

				//added
				isSameSession = false;
			}
			//if the duration exceeds 30 minutes, a new session is started
			var minutes30 = 1800000;

			if (sessionId) {
				if (sessionTime) {
					var sessionIdNum = parseInt(sessionTime, 10);
					if (
						Number.isNaN(sessionIdNum) ||
						new Date().getTime() - sessionIdNum > minutes30 ||
						new Date().getDate() !== new Date(sessionIdNum).getDate()
					) {
						isSameSession = false;
					}
				}
			}
			if (!sessionId || !isSameSession || !sessionTime) {
				if (pageId) {
					window.removeEventListener('scroll', scrollHandler);
					document.removeEventListener('visibilitychange', logData);
				}
				adpushup.utils.log('no session ID');
				sessionId = new Date().getTime();
				window.localStorage.setItem(sessionIdKey, sessionId);
			}
			if (!pageId) {
				pageId = createUUID();
			}
			sessionTime = new Date().getTime();
			window.localStorage.setItem(sessionTimeKey, sessionTime);
			window.apRecommendationPageId = pageId;
		}

		function debounce() {
			let flag = 0;
			let timer;
			return function () {
				clearTimeout(timer);
				if (flag == 0) {
					scrollMetrics.scrollStartPosition = window.scrollY;
					scrollMetrics.scrollStartTime = Date.now();
					flag = 1;
					//set scroll start metrics
				}
				timer = setTimeout(function () {
					flag = 0;
					var scrollConfig = {
						scrollDepth: window.scrollY - scrollMetrics.scrollStartPosition,
						scrollTime: (Date.now() - scrollMetrics.scrollStartTime - 3000) / 1000,
						scrollVelocity:
							((window.scrollY - scrollMetrics.scrollStartPosition) * 1000) /
							(Date.now() - scrollMetrics.scrollStartTime - 3000),
						pageId: window.apRecommendationPageId,
						userId: userId,
						sessionId: sessionId,
						domain: window.adpushup.config.domain,
						time: Date.now(),
					};
					if (window.scrollY > maxScroll) {
						maxScroll = window.scrollY;
					}
					if (scrollConfig.scrollDepth > 0)
						window.sendToLogger(scrollConfig, 'recommendationv2_scroll');
					//send scroll end event
				}, 3000);
			};
		}
		var scrollHandler = debounce();

		function getSelectedText() {
			var text = '';
			if (typeof window.getSelection != 'undefined') {
				text = window.getSelection().toString();
			} else if (typeof document.selection != 'undefined' && document.selection.type == 'Text') {
				text = document.selection.createRange().text;
			}
			return text;
		}

		function doSomethingWithSelectedText() {
			var selectedText = getSelectedText();
			if (selectedText) {
				highlighted = true;
			}
		}

		document.onmouseup = doSomethingWithSelectedText;
		document.onkeyup = doSomethingWithSelectedText;

		function createUUID() {
			var number = Math.floor(100000 + Math.random() * 900000);
			var dt = Date.now();
			var uuid = number + '_' + dt;
			return uuid;
		}

		function getInitialConfig(adpushup) {
			var properties = {
				userId: userId,
				sessionId: sessionId,
				country: adpushup.config.country,
				platform: adpushup.config.platform,
				browser: adpushup.config.browser,
				url: adpushup.config.pageUrl,
				domain: adpushup.config.siteDomain,
				siteId: adpushup.config.siteId,
				time: Date.now(),
				pageId: pageId,
				isNewUser: isNewUser,
			};

			return properties;
		}

		function checkInterLinkClick() {
			var pageHostname = window.location.hostname;
			var foundInterLinks = document.querySelectorAll('#ipsLayout_body a');
			adpushup.utils.log('checking interLinks');
			for (var i = 0; i < foundInterLinks.length; i++) {
				var interLink = foundInterLinks[i];
				var hostname = interLink.hostname;
				var hrefValue = interLink.getAttribute('href');

				if (hrefValue && hrefValue.indexOf('#') !== -1) {
					continue;
				}

				if (hostname != pageHostname) {
					continue;
				}

				if (interLink.innerText && interLink.innerText.includes('Download')) {
					continue;
				}

				adpushup.utils.log(interLink);
				interLinks.push(hrefValue);

				function onInterLinkClick(element) {
					var currentScroll = container.scrollHeight;

					var interLinkConfigObj = {
						userId: userId,
						sessionId: sessionId,
						ctaClicked: true,
						ctaUrl: element.href,
						boxHeight: currentScroll,
						maxScroll: maxScroll,
						sessionDuration: Date.now() - pageEnterTime,
						pageId: window.apRecommendationPageId,
						time: Date.now(),
						scrollDepth: window.scrollY / maxScroll,
						domain: window.adpushup.config.domain,
						highlighted: highlighted,
					};
					window.interLinkConfig = interLinkConfigObj;
				}
				function onInterLinkHover() {
					window.adpushup.utils && window.adpushup.utils.log(window.scrollY);
				}
				interLink.addEventListener('onmousedown', function (event) {
					switch (event.button) {
						case 0:
						case 1:
						case 2:
							window.apLinkPreviewUtils.contentClicked(event.target);
							break;
					}
					onInterLinkClick(this);
				});
				interLink.addEventListener('mouseenter', function (e) {
					onInterLinkHover();
				});
			}
		}

		window.sendToLogger = function (payload, eventToFire) {
			// console.log(payload, eventToFire);
			var encodedPayload = window.btoa(JSON.stringify(payload));

			var url =
				'https://aplogger.adpushup.com/log?event=' + eventToFire + '&data=' + encodedPayload;
			adpushup.utils.log(url);
			window.navigator && window.navigator.sendBeacon(url);
		};

		function logData() {
			if (document.visibilityState === 'hidden') {
				window.adpushup.utils && window.adpushup.utils.log('unload');
				var url = '';
				if (window.interLinkConfig) {
					window.sendToLogger(window.interLinkConfig, 'recommendationv2_onClick');
					window.interLinkConfig = null;
				} else {
					var noClickConfig = {
						userId,
						sessionId,
						ctaClicked: false,
						ctaUrl: '',
						boxHeight: container.scrollHeight,
						maxScroll: maxScroll,
						sessionDuration: Date.now() - pageEnterTime,
						pageId: window.apRecommendationPageId,
						time: Date.now(),
						scrollDepth: window.scrollY / maxScroll,
						domain: window.adpushup.config.domain,
					};
					window.sendToLogger(noClickConfig, 'recommendationv2_onClick');
				}
				window.navigator && window.navigator.sendBeacon(url);
			}
			if (document.visibilityState === 'visible') {
				init();
			}
		}

		function main() {
			if (window.adpushup && window.adpushup.config) {
				if (window.adpushup.activeEvents) {
					window.adpushup.activeEvents.recommendationTracking = true;
				} else {
					window.adpushup.activeEvents = {
						recommendationTracking: true,
					};
				}
				checkConsent(window.adpushup.config.country);
				if (!accessLocalStorage) return;
				if (window.adpushup.runningEvents) {
					window.adpushup.runningEvents.recommendationTracking = true;
				} else {
					window.adpushup.runningEvents = {
						recommendationTracking: true,
					};
				}
				init();
				var initialConfig = getInitialConfig(window.adpushup);
				window.sendToLogger(initialConfig, 'recommendationv2_initial');
				window.addEventListener('scroll', scrollHandler);
				document.addEventListener('visibilitychange', logData);
				checkInterLinkClick();
			} else {
				setTimeout(main, 100);
			}
		}

		main();
	} catch (e) {
		adpushup.utils.log(e);
		window.removeEventListener('scroll', scrollHandler);
		document.removeEventListener('visibilitychange', logData);
		var errorPayload = { error: e.message, site: window.adpushup.config.siteId, time: Date.now() };
		window.sendToLogger(errorPayload, 'recommendationv2_errored');
	}
})();
