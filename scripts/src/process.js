/*global define*/
define(
	[
		'lib/triangulate-image-browser-with-polyfills'
	],
	function( triangulate )
	{
		var canvas = document.getElementById( 'canvas' );
		var ctx = canvas.getContext( '2d' );
		var canvas_wrapper_el = document.querySelector( '.canvas-wrapper' );
		var processing_indicator_el;

		var is_processing = false;
		var values;
		var image;
		var signals;

		var triangulated_image_data

		var len;
		var i;

		var pxratio = ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1;

		function init( shared )
		{
			signals = shared.signals;

			signals['image-loaded'].add( generate );
			signals['control-updated'].add( controlsUpdated );
			signals['export-requested'].add( exportData );

			processing_indicator_el = document.createElement( 'div' );
			processing_indicator_el.textContent = 'generating image…';
			processing_indicator_el.classList.add( 'processing-indicator' );

			canvas_wrapper_el.appendChild( processing_indicator_el );
		}

		function controlsUpdated( new_values )
		{
			values = getAdjustedValues( new_values );

			update();
		}

		function generate( img )
		{
			if ( ! is_processing )
			{
				image = img;
				processImage( image );
			}
		}

		function update()
		{
			if ( ! is_processing && image )
			{
				processImage( image );
			}
		}

		function processImage( img )
		{
			is_processing = true;
			updateProcessingDisplay();
			clearCanvas( canvas, ctx );
			resizeCanvas( canvas, img, pxratio );
			
			triangulate( values )
				.fromImage( img )
				.toImageData( { dpr: pxratio } )
				.then( function ( triangulated_image_data ) {
					updateCanvas( ctx, triangulated_image_data );
					is_processing = false;
					updateProcessingDisplay();
				} );
		}

		function updateCanvas ( ctx, image_data )
		{
			ctx.putImageData( image_data, 0, 0 );
		}

		function resizeCanvas( canvas, img, ratio )
		{
			canvas.width = img.width * ratio;
			canvas.height = img.height * ratio;

			canvas.style.width = ( canvas.width / ratio ) + 'px';
			canvas.style.height = ( canvas.height / ratio ) + 'px';
		}

		function clearCanvas( canvas, ctx )
		{
			ctx.clearRect( ctx, 0, 0, canvas.width, canvas.height );
		}

		function exportData( callback )
		{
			if ( typeof callback === 'function' )
			{
				var export_data = {
					png: canvas.toDataURL( 'image/png' ),
					svg: triangulate( values ).fromImageSync( image ).toSVGSync()
				};

				callback( export_data );
			}
		}

		function getAdjustedValues( new_values )
		{
			var result = { };

			for ( var key in new_values )
			{
				switch ( key )
				{
					case 'blur' :
						result[key] = parseInt( scaleRange( new_values[key], 0, 100, 1, 100 ), 10 );
						break;

					case 'accuracy' :
						result[key] = scaleRange( new_values[key], 0, 100, 1, 0.1 );
						break;

					case 'vertex-count' :
						result.vertexCount = parseInt( scaleRange( new_values[key], 0, 100, 100, 5000 ), 10 );
						break;
				}

				result.fill = !! new_values.fill;
				result.gradients = !! new_values.gradients;
				result.gradientStops = 2;

				result.strokeWidth = scaleRange( new_values['stroke-width'], 0, 100, 0, 100 );
			}

			return result;
		}

		function scaleRange( value, low_1, high_1, low_2, high_2 )
		{
			return low_2 + ( high_2 - low_2) * ( value - low_1 ) / (high_1 - low_1 );
		}

		function updateProcessingDisplay () {
			if ( is_processing && ! processing_indicator_el.classList.contains( 'is-visible' ) ) {
				processing_indicator_el.classList.add( 'is-visible' )
			}

			if ( ! is_processing && processing_indicator_el.classList.contains( 'is-visible' ) ) {
				processing_indicator_el.classList.remove( 'is-visible' )
			}
		}

		return { init: init };
	}
);