window.popupStats = {};
var targetNode = document.getElementsByClassName('subpopupdiv')[0];
var observer = new MutationObserver(function () {
	if (targetNode.style.display != 'none') {
		window.popupStats.popupShown = true;
		// doSomething
	}
});
observer.observe(targetNode, { attributes: true, childList: true });

var closeBtn = document.querySelector('.subpopupclose');
closeBtn.addEventListener('click', function () {
	window.popupStats.emailShared = false;
});

var submitBtn = document.querySelector('[data-inp="popsubemail"]');
submitBtn.addEventListener('click', function () {
	window.popupStats.emailShared = true;
});
