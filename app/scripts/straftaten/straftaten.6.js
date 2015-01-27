/*global nv, d3, numeral, bowser*/
function Straftaten(dataDivisions, filter){
	var self = this;
	self.view = {};
	self.view.colors = [
		'transparent',  // restliche
		'#ff6767', //krimorg
		'#9c14db', //terror
		'#109618', //geldwäsche
		'#c2943e', //menschenhandel
		'#fe0405', //pedokriminalität
		'#668cd9', //nachrichtendienst
		'transparent'  // restliche
	];

	function init(){
		return Promise.resolve();
	}

	function totalStraftaten(year, canton){
		var sections = ['drogen', 'gewalt', 'drohung', 'sex', 'oeFrieden', 'staat', 'finanz', 'vermoegen', 'buepf', 'diverse'];
		var promises = sections.map((section) => {
				return dataDivisions[section](year, canton);
			});
		var total = 0;
		return Promise.all(promises).then(function(resolved){
			resolved.forEach(function(value){
				total += value;
			});
			return total;
		});
	}

	function controller(){
		function selectionChanged(year, canton){
			var sections = ['krimorg', 'terror', 'geldwaesche', 'menschenhandel', 'paedo', 'nachrichtendienst'];
			var colors = self.view.colors;
			var total = 0;
			var innerRadiusFactor = 0.5;
			var promises = sections.map((section) => {
				return dataDivisions[section](year, canton);
			});
			d3.selectAll('#straftaten .nv-legendWrap>text').remove();

			promises.push(totalStraftaten(year, canton));

			Promise.all(promises).then(function(resolved){
				var allStraftatenTotal = resolved.pop();
				self.view.sections = sections;
				self.view.sectionValues = {};
				resolved.forEach(function(value, i){
					var abs = value[0];
					self.view.sectionValues[sections[i]] = {
						value: abs,
						key: window.i18n.l('schwerestraftaten_txt_'+sections[i]),
						color: colors[i],
						idx: i,
						rgb: ['r', 'g', 'b'].map((v) => { return d3.rgb(colors[i])[v]; }).join(', ')
					};
					total += abs;
				});
				render.call(self);

				nv.addGraph(function() {
				    var chart = nv.models.pieChart();
				    chart.pie
					    .startAngle(function(d) { return d.startAngle/2 -Math.PI/2; })
					    .endAngle(function(d) { return d.endAngle/2 -Math.PI/2 ;});
			    	chart.donut(true);
				    var margin = -40;
				    chart.margin({left: margin, right: margin, top: margin, bottom: margin});
				    chart.tooltips(false);
				    chart.showLabels(false);
				    chart.showLegend(false);
				    chart.donutRatio(innerRadiusFactor);
				    chart.labelThreshold(0);
				    chart.x(function(d) { return d.label; })
						 .y(function(d) { return d.value; });
					d3.scale.slirColors = () => {
				        return d3.scale.ordinal().range(colors);
				    };
				    chart.color(d3.scale.slirColors().range());

				    var series = resolved.map((section, idx) => {
				    	return {
				    		label: window.i18n.l('schwerestraftaten_txt_'+sections[idx]),
				    		value: resolved[idx][0]*2
				    	};
					});

					series.splice(0, 0, {
						label: window.i18n.l('schwerestraftaten_txt_total_straftaten'),
						value: allStraftatenTotal/2
					});

					series.push({
						label: window.i18n.l('schwerestraftaten_txt_total_straftaten'),
						value: allStraftatenTotal/2
					});

					d3.select('#straftaten>svg').datum(series)
				    	.transition()
				    	.duration(250)
				    	.call(chart);

				    function updateLabel(idx){
				    	var sliceIdx = +idx+1;
				    	var value = series[sliceIdx].value;
               			var percent = (value/(total/100)).toFixed(2);
               			value = numeral(series[sliceIdx].value).format();
               			var descrI18nKey = sections[idx] || 'total_straftaten';
               			var descr = window.i18n.l('schwerestraftaten_descr_'+descrI18nKey);

               			$('#straftatenDescr').text(descr);
               			$('#straftatenTable td').removeClass('active');
               			$('#straftatenTable tr').eq(idx).find('td:last-child').addClass('active');

				    	var svgWidth = $('#straftaten>svg').width();
               			var svgHeight = $('#straftaten>svg').height();
               			var centerX = svgWidth/2 - 20;
               			var centerY = svgHeight/2 - 10;
               			d3.selectAll('#straftaten .nv-legendWrap>text').remove();

						var textSelected =d3.select('#straftaten .nv-legendWrap')
               				.append('text');
	       				if(bowser.browser.msie || bowser.browser.gecko){
	       					textSelected.attr('text-anchor', 'middle');
	       				}
               			textSelected.text(`${value} (${percent}%)`);
               			var textWidth = $(textSelected[0]).width();
               			var textX = centerX - textWidth/2;
               			textSelected.attr('transform', `translate(${textX}, ${centerY-38})`);
				    }

			    	var $slices = $('#straftaten .nv-slice');
			    	var $paths = $slices.find('>path');
				    function updateArc(idx, hover){
				    	var translate = '';
				    	if(hover === true){
				    		translate = 'scale(1.05, 1.05)';
				    	}
			    		var elPath = $paths.get(idx+1);
			    		d3.select(elPath)
			    			.transition()
               				.duration(250)
               				.attr('transform', translate);

               			updateLabel(idx);
				    }

				    nv.utils.windowResize(() => {chart.update(); });

			    	$('#straftatenTable tr').on('mouseenter', (e)=>{
			    		var idx = e.currentTarget.attributes['data-idx'].value;
			    		updateLabel(idx);
			    		updateArc(idx, true);
			    	})
			    	.on('mouseleave', (e)=>{
			    		var idx = e.currentTarget.attributes['data-idx'].value;
			    		updateArc(idx, false);
			    	});

			    	$slices.on('mouseenter', (e)=>{
			    		var idx = series.findIndex((serie)=>{return serie.label === e.currentTarget.__data__.data.label;});
			    		updateLabel(idx);
			    	})
			    	.on('mouseleave', (e)=>{
			    		var idx = series.findIndex((serie)=>{return serie.label === e.currentTarget.__data__.data.label;});
			    		updateLabel(idx);
			    	});
			 	});
			});
		}
		filter.emitter.on('selectionChanged', selectionChanged);

		return Promise.resolve();
	}

	function render(){
		var template = require('./straftatenTable.jade');
		var html = template({view: this.view});
		$('#straftatenTable').html(html);
		return Promise.resolve();
	}

	init.call(this)
		.then(controller.bind(this))
		.then(render.bind(this))
		.catch((err) => {
			console.error(err.message);
		});
}

module.exports = Straftaten;