
    var app = {
       layers : {},
       layersCount : 1,
       selectedLayers : {},
       canvas : null,
       buffer : null,
       width : 600,
       height : 400,
       color : '#000000',
       tool : 'pen',
       mouse : {
            mouseX : 0,
            mouseY : 0
       },
       pen : {
            options:{
                lineBegin : false,
                width : 10
            }
       },
       brush : {
           options:{
               lineBegin : false
           }
       },
       selection : {
           options:{
               begin : false
           }
       },
       grayscaleOptions : {
           r : 0.2126,
           g : 0.7152,
           b : 0.0722
       },
       init : function()
        {
            var that = this;
            $('Layer0').css("float","left");
            //primary canvas
            var context = document.getElementById('Layer0').getContext('2d');
            context.fillStyle = 'white';
            context.fillRect(0, 0, document.getElementById('Layer0').width, document.getElementById('Layer0').height);
            this.layers["Layer0"]=context;
            this.canvas=context;
            this.pixels = this.canvas.getImageData(0,0,this.width,this.height);

            //this.buffer =  document.getElementById('buf').getContext('2d');
            //sliders initialisation
            $(".r").slider();
            $(".b").slider();
            $(".g").slider();
            $(".a").slider({change: function( event, ui ) {
                that.canvas.putImageData( that.opacity($(".a").slider("value") / 100),0,0);
            }});

            $(".r").slider("value",this.grayscaleOptions.r * 100);
            $(".b").slider("value",this.grayscaleOptions.b * 100);
            $(".g").slider("value",this.grayscaleOptions.g * 100);

            this.brush.brush = new Image();
            this.brush.brush.src = 'js/brush21.png';
            this.brush.halfBrushW = this.brush.brush.width/2;
            this.brush.halfBrushH = this.brush.brush.height/2;

            //colorpicker
            $('#colorSelector').ColorPicker({
                color: '#0000ff',
                onShow: function (cp) {
                    $(cp).fadeIn(500);
                    return false;
                },
                onHide: function (cp) {
                    $(cp).fadeOut(500);
                    return false;
                },
                onChange: function (hsb, hex, rgb) {
                    $('#colorSelector div')
                        .css('backgroundColor', '#'+hex);
                    that.color = '#'+hex;
                }
            });

            //events binding

            $('.filter p').click(function(){
                $(this).parent().find(".params").slideToggle();
            });

            $('.grayscale button').click(function(){
                that.canvas.putImageData(
                that.grayscale(
                    $(".grayscale .r").slider("value") / 100,
                    $(".grayscale .g").slider("value") / 100,
                    $(".grayscale .b").slider("value") / 100
                ), 0, 0);
            });

            $('#tools td').click(function(){
                $(this).parent().parent().find(".selected").removeClass('selected');
                $(this).addClass('selected');
            });

            $('.img span').click(function(){
                $('#imageLoader').click();
            }).show();

            $('.brush').click(function(){
                that.tool = "brush";
            });

            $('.pen').click(function(){
                that.tool = "pen";
            });

            $("#imageLoader").live("change", function(e){
                var reader = new FileReader();
                reader.onload = function(event){
                    var img = new Image();
                    img.onload = function(){
                        that.canvas.drawImage(img,0,0);
                        that.pixels = that.canvas.getImageData(0,0,that.width,that.height);
                    }
                    img.src = event.target.result;
                }
                reader.readAsDataURL(e.target.files[0]);
            });

            $("canvas").live("mousedown", function(e){
                that.canvas.fillStyle = that.color;
                that.canvas.strokeStyle = that.color;
                that.mouse.mouseX= e.pageX - $(this).offset().left;
                that.mouse.mouseY= e.pageY - $(this).offset().top;
                switch (that.tool){
                    case 'pen':
                        that.pen.options.lineBegin=true;
                        break;
                    case 'brush':
                        that.brush.start = { x:that.mouse.mouseX, y:that.mouse.mouseY };
                        that.brush.options.lineBegin=true;
                        break;
                    case 'selection':
                        that.selection.options.begin=true;
                        break;
                    default :
                        break;
                }
            });

            $("canvas").live("mousemove", function(e){
                var rect = document.getElementById('Layer0').getBoundingClientRect();
                switch (that.tool){
                    case 'pen':
                        if (that.pen.options.lineBegin)
                        {
                            currentX = e.pageX - rect.left;
                            currentY = e.pageY - rect.top;
                            that.canvas.beginPath();
                            that.canvas.moveTo(that.mouse.mouseX, that.mouse.mouseY);
                            that.canvas.lineTo(currentX, currentY);
                            that.canvas.stroke();
                            that.mouse.mouseX= currentX;
                            that.mouse.mouseY= currentY;
                            that.canvas.closePath();
                        }
                        break;
                    case 'brush':
                        if (that.brush.options.lineBegin)
                        {
                            that.brush.end = { x:e.pageX - rect.left, y:e.pageY - rect.top };
                            var distance = parseInt( Trig.distanceBetween2Points( that.brush.start, that.brush.end ) );
                            var angle = Trig.angleBetween2Points( that.brush.start, that.brush.end );
                            for ( var z=0; (z<=distance || z==0); z++ ) {
                                x = that.brush.start.x + (Math.sin(angle) * z) - that.brush.halfBrushW;
                                y = that.brush.start.y + (Math.cos(angle) * z) - that.brush.halfBrushH;
                                that.roundRect(x, y);
                            }
                            that.brush.start = that.brush.end;
                        }
                        break;
                    case 'selection':
                        if (that.selection.options.begin)
                        {

                        }
                        break;
                    default :
                        break;
                }
            });

            $("body").live("mouseup", function(e){
                switch (that.tool){
                    case 'pen':
                        that.pen.options.lineBegin=false;
                        break;
                    case 'brush':
                        that.brush.options.lineBegin=false;
                        break;
                    case 'selection':
                        that.selection.options.begin = false;
                        break;
                    default :
                        break;
                }
                //$(".contextMenu").hide();
            });

            $("body").on("click", function(e){
                    if( e.button != 2 )
                        $(".contextMenu").hide();
            });

            $(".selectLayer").live("mousedown", function(e){

                if( e.button == 2 ) {
                    $(".contextMenu").css({"left" : e.pageX,
                                            "top" : e.pageY }).show();
                }
                else
                {
                    $(".contextMenu").hide();
                }
            });

            $(".contextMenu span").live("mousedown", function(e){
                e.preventDefault();
                var pixels = [];


                pixels = that.layers["Layer1"].getImageData(0,0,that.width, that.height);

                $('canvas').each(function(index){
                    if ( index != 0 )
                    {
                        that.layers["Layer0"].drawImage(this,0,0);
                        this.remove();
                    }
                });
                $('.newLayer').remove();
                that.setActiveCanvas('Layer0');
            });


            $(".selectLayer button").click( function(){
                that.createLayer();
            });

            $(".selectLayer span").live("click", function(){
                that.setActiveLayer($(this).parent());
                console.log($(this).html());
                that.canvas = that.layers[$(this).html()];
                that.pixels = that.canvas.getImageData(0,0,that.width, that.height);
            });

            $(".deleteLayer").live("click", function(){

                var layer = $(this).parent().find('span').html();
                delete that.layers[layer];
                $(this).parent().remove();
                $('#'+layer).remove();
                that.setActiveCanvas('Layer0');
            });
        },

        handleImage : function(e)
        {

        },

        setActiveLayer : function(el)
        {
            var layer = $(el).find('span').html();
            this.setActiveCanvas(layer);
            $(el).parent().find('li').removeClass('selected');
            $(el).addClass('selected');
        },

        setActiveCanvas : function(layer)
        {
            this.canvas = this.layers[layer];
        },

        createLayer : function(){
            var canvas = document.createElement('canvas');
            $('.canv').append(canvas);
            if(canvas && canvas.getContext)
            {
                //return canvas.getContext('2d');
                var currentIndex = "Layer"+ this.layersCount.toString();
                canvas.id = currentIndex;
                canvas.height = this.height;
                canvas.width = this.width;
                this.layers[currentIndex]= canvas.getContext('2d');
                this.layersCount++;
                //this.layers.push(map);
                this.canvas = this.layers[currentIndex];
                this.pixels = this.canvas.getImageData(0,0,this.width, this.height);
                this.newLayerView(currentIndex);
            }
        },

        newLayerView : function( name ){
            var template = $('<li class="newLayer"><span>'+name+'</span><a class="deleteLayer"></a></li>');
            $('.selectLayer ul').append(template);
            this.setActiveLayer(template);
        },

        grayscale : function( rPref, gPref, bPref ) {
            var pixels = this.canvas.getImageData(0,0,this.width,this.height);
            var d = pixels.data;
            for (var i=0; i<d.length; i+=4) {
                d[i] = d[i] *  ( rPref + 0.5) ;
                d[i+1] = d[i+1] *  ( gPref + 0.5);
                d[i+2] = d[i+2] *  ( bPref + 0.5);
            }
            return pixels;
        },

        opacity : function( aPref ) {
            var pixels = this.canvas.getImageData(0,0,this.width,this.height);
            var d = pixels.data;
            for(var i=3; i < d.length; i+=4){
                d[i] = d[i] * (aPref + 0.5);
            }
            return pixels;
        },


        filterImage : function(filter, image, var_args) {
        var args = [this.pixels];
        for (var i=2; i<arguments.length; i++) {
            args.push(arguments[i]);
        }
        return filter.apply(null, args);
        },

        hexToRGB : function (hex)
        {
            var long = parseInt(hex.replace(/^#/, ""), 16);
            return {
                R: (long >>> 16) & 0xff,
                G: (long >>> 8) & 0xff,
                B: long & 0xff
            };
        },

        changeColor : function()
        {
            var newColor = this.hexToRGB(this.color);
            this.buffer.drawImage(this.brush.brush, 0, 0);
            var currentPixels = this.buffer.getImageData(0, 0, 20, 20);

            for(var I = 0, L = this.brush.brush.data.length; I < L; I += 4)
            {
                if(currentPixels.data[I + 3] > 0)
                {
                    currentPixels.data[I] = currentPixels.data[I] / 255 * newColor.R;
                    currentPixels.data[I + 1] = currentPixels.data[I + 1] / 255 * newColor.G;
                    currentPixels.data[I + 2] = currentPixels.data[I + 2] / 255 * newColor.B;
                }
            }

            this.buffer.putImageData(currentPixels, 0, 0);
            this.brush.brush.src = $(".buf").toDataUrl();
        },

        roundRect : function( x, y) {
        var radius = 10;
            height = 20;
            width = 20;
        this.canvas.beginPath();
            this.canvas.moveTo(x + radius, y);
            this.canvas.lineTo(x + width - radius, y);
            this.canvas.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.canvas.lineTo(x + width, y + height - radius);
            this.canvas.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.canvas.lineTo(x + radius, y + height);
            this.canvas.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.canvas.lineTo(x, y + radius);
            this.canvas.quadraticCurveTo(x, y, x + radius, y);
        this.canvas.closePath();
        this.canvas.fill();
    }
    };

    //brush drawing coords function
    var Trig = {
        distanceBetween2Points: function ( point1, point2 ) {
            var dx = point2.x - point1.x;
            var dy = point2.y - point1.y;
            return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
        },

        angleBetween2Points: function ( point1, point2 ) {
            var dx = point2.x - point1.x;
            var dy = point2.y - point1.y;
            return Math.atan2( dx, dy );
        }
    };

    app.init();
