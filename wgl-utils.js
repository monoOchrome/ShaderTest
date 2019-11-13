WGL.utils = {
	clamp(number, lower, upper){
		if(isNaN(number)) number = 0;
		if(isNaN(lower)) lower = 0;
		if(isNaN(upper)) upper = 0;
		return number < lower ? lower : (number > upper ? upper : number);
	},
    defineRect: function(x, y, w, h){
		return [x, y, x + w, y, x, y + h, x, y + h, x + w, y, x + w, y + h];
    },
    outExpo(n){
        return 1 == n ? n : 1 - Math.pow(2, -10 * n);
    }
};