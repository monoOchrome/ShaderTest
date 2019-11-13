var C = {
    disps: [
        {url: "../img/maps/12.jpg"},
        {url: "../img/maps/2.jpg"},
        {url: "../img/maps/9.jpg"},
        {url: "../img/maps/13.png"},
        {url: "../img/maps/4.jpg"}
    ],
    maxTilt: 15,
	currentX: 0,
	currentY: 0,
	targetX: 0,
	targetY: 0,
    wgl: null,
	init: function(){
        if(WGL.supports()){
            this.wgl = WGL
                .with('.cnvs')
                .using(sliderVS, sliderFS)
                .resources([{url: '../img/efes2.jpg'}, {url: '../img/lady.jpg'}, {url: '../img/mount.jpg'}])
                .on('trigger')
                .displace({url: '../img/maps/12.jpg'})
                .using(fake3DVS, fake3DFS)
                .on('move', 'orientation')
                .blend([
                    {url: '../img/maps/efes2.jpg', shaderData: {x_fac: 30, y_fac: -30}},
                    {url: '../img/maps/lady.jpg', shaderData: {x_fac: 35, y_fac: 15}},
                    {url: '../img/maps/mount-map.jpg', shaderData: {x_fac: 15, y_fac: -35}}
                ])
                .onComplete(function(){
                    $('.preloader').remove();
                });
        }

        $(".nav span").on("click", function(event){
            if($(event.target).hasClass("active")) return;

            var dir = $(event.target).text();
            var currentIndex = null;
            if(dir == "Prev") currentIndex = C.wgl.actions['trigger'].prev({x_fac: -0.6, y_fac: -0.6});
            else if(dir == "Next") currentIndex = C.wgl.actions['trigger'].next({x_fac: 0.6, y_fac: 0.6});
            else{
                var value = 0.6;
                if(C.wgl.activeTextureIndex > dir - 1) value = -0.6;
                currentIndex = C.wgl.actions['trigger'].goto(dir - 1, {x_fac: value, y_fac: value});
            }

            $(".nav span").eq(currentIndex + 1).addClass("active").siblings().removeClass("active");
        });

        $(".links span").on("click", function(event){
            if($(event.target).hasClass("active")) return;
            $(event.target).addClass("active").siblings().removeClass("active");
            C.wgl.displace(C.disps[$(event.target).index()]);
        });

        $(window).on("mousemove", function(event){
			C.targetX = (event.clientX  - window.innerWidth / 2) / 32;
			C.targetY = (event.clientY  - window.innerHeight / 2) / 32;
        });
        
        if(window.DeviceOrientationEvent){
            window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this));
        }

        requestAnimationFrame(this.animate.bind(this));
    },
    startAlpha: null,
    startBeta: null,
    onDeviceOrientation: function(event){
        if(this.startAlpha === null) this.startAlpha = event.alpha;
        if(this.startBeta === null) this.startBeta = event.beta;

        var a = WGL.utils.clamp(event.alpha - this.startAlpha, -this.maxTilt,  this.maxTilt) * ((window.innerWidth / 2) / this.maxTilt);
        var b = WGL.utils.clamp(event.beta - this.startBeta, -this.maxTilt,  this.maxTilt) * ((window.innerWidth / 2) / this.maxTilt);
        C.targetX = a / 32;
        C.targetY = b / 32;
    },
	animate: function(time){
		this.currentX += .05 * (this.targetX - this.currentX);
		this.currentY += .05 * (this.targetY - this.currentY);
		$(".text").css("transform", "translate(" + this.currentX + "px, " + -this.currentY + "px)");
		requestAnimationFrame(this.animate.bind(this));
	}
};

// window.onload = function () {

// 	// Check if is IOS 13 when page loads.
// 	if ( window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function' ){
// 		$('p').text('require.')
// 		// Everything here is just a lazy banner. You can do the banner your way.
// 		const banner = document.createElement('div')
// 		banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; background-color:#000; color: #fff"><p style="padding: 10px">Click here to enable DeviceMotion</p></div>`
// 		banner.onclick = ClickRequestDeviceMotionEvent // You NEED to bind the function into a onClick event. An artificial 'onClick' will NOT work.
// 		document.querySelector('body').appendChild(banner)
// 	}
//   }
  
  
//   function ClickRequestDeviceMotionEvent () {
// 	window.DeviceMotionEvent.requestPermission()
// 	  .then(response => {
// 		if (response === 'granted') {
// 		  window.addEventListener('devicemotion',
// 			() => { $('p').text('DeviceMotion permissions granted.') },
// 			(e) => { throw e }
// 		)} else {
// 			$('p').text('DeviceMotion permissions not granted.')
// 		}
// 	  })
// 	  .catch(e => {
// 		console.error(e)
// 	  })
//   }

C.init();