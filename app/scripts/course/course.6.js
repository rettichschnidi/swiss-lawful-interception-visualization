/*global d3*/
function Course(dataSummary, legendTemplate, i18n, nv){
	var self = this;
	var numeral = i18n.numeral;
	self.view = {
		l: i18n.l,
		keys: [],
		titleText: null
	};

	function selectionChanged(e){
		self.view.keys.forEach((key)=>{
   			$(`#course-legend .legend_typ_${key}`).text(numeral(this.view.totalsPerYear[e.data.x][key]).format());
		});
   		self.view.titleText = self.view.titleText || $('#course-legend>h2').text();
   		$('#course-legend>h2').text(`${self.view.titleText} ${e.data.x}`);
   	}

	function controller(){
		return new Promise((resolve, reject)=>{

			nv.addGraph(function() {
			    var chart = nv.models.multiBarChart();
			    	chart.multibar.stacked(true);
			    	chart.tooltip.enabled(false);
			    	chart.showControls(false)
			    	.groupSpacing(0.25)
			    	.showLegend(false)
				    .height(300)
				    .reduceXTicks(false)
				    .color(['#FE0405', '#9BBB59', '#668CD9']); // telefonbuch, facebook and microsoft are not in charts datum. first color is for techadm

				// 'facebook', 'microsoft' prepend to array when data available
				var keys = ['telefonbuch', 'aktiv', 'vds', 'techadm'];
				self.view.keys = keys;
				var promises = keys.map(function(key){
					return dataSummary[key]();
				});
			    Promise.all(promises).then(function(resolved){
			    	var facebook = resolved[0];
			    	var microsoft = resolved[1];
			    	var tel = resolved[0];  // with facebook and microsoft -> resolved[2]
			    	var totalsPerYear = {};
			    	self.view.totalsPerYear = totalsPerYear;

			       	chart.multibar.dispatch.on('elementClick', selectionChanged.bind(self));
			       	chart.multibar.dispatch.on('elementMouseover', selectionChanged.bind(self));

			       	tel.map(function(r){
		    			totalsPerYear[r.year] = totalsPerYear[r.year] || {};
			    		totalsPerYear[r.year].telefonbuch = r.value;
		    		});

		    		microsoft.map(function(r){
			    		totalsPerYear[r.year].microsoft = r.value;
		    		});

		    		facebook.map(function(r){
			    		totalsPerYear[r.year].facebook = r.value;
		    		});

			       	var notInChart = ['telefonbuch', 'facebook', 'microsoft'];
		    		var datum = keys.map((key, idx) => {
		    			var values = resolved[idx];
		    			if(notInChart.indexOf(key)!==-1) {return null; }
		    			return {
		    				key: i18n.l('typ_txt_'+keys[idx]),
		    				values: values.map(r => {
		    					totalsPerYear[r.year][keys[idx]] = r.value;
		    					return {x: r.year, y: r.value || 0};
		    				})
		    			};
		    		});

		    		datum = datum.filter(d => { return d; });

				    d3.select('#course>svg').datum(datum)
					   	.transition()
				    	.duration(250)
				    	.call(chart);

			       	resolve();
			       	self.view.latestYear = tel[tel.length-1].year;

			    }).catch(err => {reject(err);});

			    chart.yAxis.tickFormat(n=>{
			    	return numeral(n).format();
			    });
			    chart.yAxis.axisLabel(i18n.l('txt_txt_anzahl_anfragen'));
				chart.xAxis.tickFormat((y)=>{
					var latestYear = Math.max.apply(null, Object.keys(self.view.totalsPerYear));
					var isLastYear = latestYear === y;
					// 2014 - 1998 = 16%2 = 0 => 1998
					// 2014 - 1999 = 15%2 = 1 => ''
					// 2014 - 2013 = 1%2 = 1 => ''
					// 2015 - 1998 = 17%2 = 1 => ''
					// 2015 - 2014 = 1%2 = 1 => ''
				    return (isLastYear || ((latestYear-y)%2===0)) ? y : '';
				});

			    nv.utils.windowResize(() => {chart.update(); });

			    return chart;
			});
		});
	}

	function render(){
		var html = legendTemplate(this.view);
		$('#course-legend').html(html);
		return Promise.resolve();
	}

	controller.call(this)
		.then(render.bind(this))
		.then(() => { selectionChanged.call(this, {data: {x: self.view.latestYear}}); })
		.catch(function(err){
			console.error(err);
		});
}

module.exports = Course;