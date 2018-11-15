console.log('service worker loaded...');
self.addEventListener('push', e => {
	const data = e.data.json();
	console.log('push  received...');
	self.registration.showNotification(data.title,{
		//body:'hello by muhammad sajid',
		icon:'images/image.png'
	});
});