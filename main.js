var C = {
    disps: [
        {url: "img/maps/12.jpg"},
        {url: "img/maps/2.jpg"},
        {url: "img/maps/9.jpg"},
        {url: "img/maps/13.png"},
        {url: "img/maps/4.jpg"}
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
                .resources([{url: 'img/efes2.jpg'}, {url: 'img/lady.jpg'}, {url: 'img/mount.jpg'}])
                .on('trigger')
                .displace({url: 'img/maps/12.jpg'})
                .using(fake3DVS, fake3DFS)
                .on('move', 'orientation')
                .blend([
                    {url: 'img/maps/efes2.jpg', shaderData: {x_fac: 30, y_fac: -30}},
                    {url: 'img/maps/lady.jpg', shaderData: {x_fac: 35, y_fac: 15}},
                    {url: 'img/maps/mount-map.jpg', shaderData: {x_fac: 15, y_fac: -35}}
                ])
                .onComplete(function(){
                    $('.preloader').remove();
                    C.initDeviceOrientation();
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

        requestAnimationFrame(this.animate.bind(this));
    },
    initDeviceOrientation: function(){
        if(window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function'){
            const banner = document.createElement('div')
            banner.innerHTML = `<div style="z-index: 1; position: absolute; width: 100%; top:0;left:0; background-color:#000; color: #fff"><p class="permission" style="padding: 10px">Click here to enable DeviceMotion</p></div>`
            banner.onclick = C.ClickRequestDeviceMotionEvent;
            document.querySelector('body').appendChild(banner);
        }else if(window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission !== 'function'){
            $('p').text(typeof window.DeviceMotionEvent.requestPermission);
            C.onDeviceOrientation();
        }
    },
    onDeviceOrientation: function(){
        var gn = new GyroNorm();
        gn
        .init({gravityNormalized: true})
        .then(function(){
            gn.start(function(data){
                var x = WGL.utils.clamp(data.do.gamma, -this.maxTilt,  this.maxTilt) * ((window.innerWidth / 2) / this.maxTilt)
                var y = -WGL.utils.clamp(data.do.beta, -this.maxTilt,  this.maxTilt) * ((window.innerWidth / 2) / this.maxTilt);
                $('p').text(x.toFixed(2) + '/' + y.toFixed(2));
                C.targetX = x / 4;
                C.targetY = y / 4;
            });
        }).catch(function(e){
            $('p').text('nosupport');
        });
    },
	animate: function(time){
		this.currentX += .05 * (this.targetX - this.currentX);
		this.currentY += .05 * (this.targetY - this.currentY);
		$(".text").css("transform", "translate(" + this.currentX + "px, " + -this.currentY + "px)");
		requestAnimationFrame(this.animate.bind(this));
    },
    ClickRequestDeviceMotionEvent: function(){
        window.DeviceMotionEvent
        .requestPermission()
        .then(function(response){
            if(response === 'granted'){
                $('.request-banner').remove();
                C.onDeviceOrientation();
            }
        })
        .catch(function(error){})
    }
};

C.init();