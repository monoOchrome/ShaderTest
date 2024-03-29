var C = {
    disps: [
        {url: "img/maps/12.jpg"},
        {url: "img/maps/2.jpg"},
        {url: "img/maps/9.jpg"},
        {url: "img/maps/13.png"},
        {url: "img/maps/4.jpg"}
    ],
    maxTilt: 2,
	currentX: 0,
	currentY: 0,
	targetX: 0,
    targetY: 0,
    touchStartX: 0,
    touchEndX: 0,
    wgl: null,
    mobileShaderValues: [10, 20, 25],
    desktopShaderValues: [10, 30, 30],
	init: function(){
        var source = this.desktopShaderValues;
        if(WGL.utils.isMobile()) source = this.mobileShaderValues;
        if(WGL.supports()){
            this.wgl = WGL
                .with('.cnvs')
                .using(sliderVS, sliderFS)
                .resources([{url: 'img/mount.jpg'}, {url: 'img/lady.jpg'}, {url: 'img/efes2.jpg'}])
                .on('trigger')
                .displace({url: 'img/maps/12.jpg'})
                .using(fake3DVS, fake3DFS)
                .on('move')
                .blend([
                    {url: 'img/maps/mount-map.jpg', shaderData: {x_fac: source[0], y_fac: -35}},
                    {url: 'img/maps/lady.jpg', shaderData: {x_fac: source[1], y_fac: 15}},
                    {url: 'img/maps/efes2.jpg', shaderData: {x_fac: source[2], y_fac: -30}}
                ])
                .onComplete(function(){
                    $('.preloader').remove();
                    C.initDeviceOrientation();
                });
        }

        if(WGL.utils.isMobile()){
            window.addEventListener('touchstart', function(event) {
                C.touchStartX = event.changedTouches[0].screenX;
            }, false);
            window.addEventListener('touchend', function(event) {
                C.touchEndX = event.changedTouches[0].screenX;
                C.onTouch();
            }, false); 
        }else{
            $(window).on("mousemove", function(event){
                C.targetX = (event.clientX  - window.innerWidth / 2) / 32;
                C.targetY = (event.clientY  - window.innerHeight / 2) / 32;
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

        requestAnimationFrame(this.animate.bind(this));
    },
    initDeviceOrientation: function(){
        if(window.DeviceMotionEvent){
            if(typeof window.DeviceMotionEvent.requestPermission === 'function'){
                var grant = false;
                window.DeviceMotionEvent
                    .requestPermission()
                    .then(function(response){ 
                        if(response === 'granted') C.onDeviceOrientation();
                        else C.addRequestBanner();
                    })
                    .catch(function(error){ C.addRequestBanner(); })
            }else{
                C.onDeviceOrientation();
            }
        }
    },
    addRequestBanner: function(){
        $('body').append('<div class="request-banner" style="z-index: 1; position: absolute; width: 100%; top:0;left:0; background-color:#000; color: #fff"><p class="permission" style="padding: 10px">Click here to enable DeviceMotion</p></div>');
        $('.request-banner')[0].onclick = C.ClickRequestDeviceMotionEvent;
    },
    onDeviceOrientation: function(){
        var gn = new GyroNorm();
        gn
        .init({orientationBase: GyroNorm.GAME, screenAdjusted: true, decimalCount: 0, frequency: 17, gravityNormalized: true})
        .then(function(){
            C.wgl.actions['orientation'].enable();
            gn.start(function(data){
                var x = WGL.utils.clamp(data.do.gamma, -C.maxTilt,  C.maxTilt) * ((window.innerWidth / 2) / C.maxTilt)
                C.targetX = x / 32;
                C.wgl.actions['orientation'].targetX = -WGL.utils.clamp(data.do.gamma, -C.maxTilt, C.maxTilt) / C.maxTilt;
                // C.wgl.actions['orientation'].targetY = -WGL.utils.clamp(data.do.beta - 70, -C.maxTilt, C.maxTilt) / C.maxTilt;
            });
        }).catch(function(e){});
    },
    onTouch: function(){
        var dir = '';
        if(C.touchEndX - C.touchStartX < -20) dir = 'Next';
        if(C.touchEndX - C.touchStartX > 20) dir = 'Prev';

        if(dir){
            var currentIndex = null;
            if(dir == "Prev") currentIndex = C.wgl.actions['trigger'].prev({x_fac: -0.6, y_fac: -0.6});
            else if(dir == "Next") currentIndex = C.wgl.actions['trigger'].next({x_fac: 0.6, y_fac: 0.6});
            $(".nav span").eq(currentIndex + 1).addClass("active").siblings().removeClass("active");
        }
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
            .catch(function(error){});
    }
};

C.init();