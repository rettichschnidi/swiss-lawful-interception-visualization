/*global nv, d3*/
function Course(dataSummary, legendTemplate, i18n){
	var self = this;
	var numeral = i18n.numeral;
	self.view = {
		l: i18n.l,
		keys: [],
		titleText: null
	};

	function controller(){
		return new Promise((resolve, reject)=>{

			nv.addGraph(function() {
			    var chart = nv.models.multiBarChart();
			    	chart.multibar.stacked(true);
			    	chart.showControls(false)
			    	.groupSpacing(0.25)
			    	.showLegend(false)
				    .height(300)
					.tooltips(false)
				    .reduceXTicks(true)
				    .color(['#FE0405', '#9BBB59', '#668CD9']); // telefonbuch is not in charts datum. first color is for techadm

				var keys = ['telefonbuch', 'aktiv', 'vds', 'techadm'];
				self.view.keys = keys;
				var promises = keys.map(function(key){
					return dataSummary[key]();
				});
			    Promise.all(promises).then(function(resolved){
			    	var tel = resolved[0];
			    	var totalsPerYear = {};
			    	self.view.totalsPerYear = totalsPerYear;

			       	chart.multibar.dispatch.on('elementClick', selectionChanged.bind(self));
			       	chart.multibar.dispatch.on('elementMouseover', selectionChanged.bind(self));

			       	tel.map(function(r){
		    			totalsPerYear[r.year] = totalsPerYear[r.year] || {};
			    		totalsPerYear[r.year].telefonbuch = r.value;
		    		});

		    		var datum = keys.map((key, idx) => {
		    			var values = resolved[idx];
		    			if(key === 'telefonbuch') {return null; }
		    			return {
		    				key: i18n.l('typ_txt_'+keys[idx]),
		    				values: values.map(r => {
		    					totalsPerYear[r.year] = totalsPerYear[r.year] || {};
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

			    chart.yAxis.tickFormat(function(n){
			    	return numeral(n).format();
			    });
			    chart.yAxis.axisLabel(i18n.l('txt_txt_anzahl_anfragen'));

			    nv.utils.windowResize(() => {chart.update(); });

			    return chart;
			});
		});
	}

	function selectionChanged(e){
   		$('#legend_typ_telefonbuch').text(numeral(this.view.totalsPerYear[e.point.x].telefonbuch).format());
   		$('#legend_typ_aktiv').text(numeral(this.view.totalsPerYear[e.point.x].aktiv).format());
   		$('#legend_typ_vds').text(numeral(this.view.totalsPerYear[e.point.x].vds).format());
   		$('#legend_typ_techadm').text(numeral(this.view.totalsPerYear[e.point.x].techadm).format());
   		self.view.titleText = self.view.titleText || $('#course-legend>h2').text();
   		$('#course-legend>h2').text(`${self.view.titleText} ${e.point.x}`);
   	}

	function render(){
		var html = legendTemplate(this.view);
		$('#course-legend').html(html);
		return Promise.resolve();
	}

	controller.call(this)
		.then(render.bind(this))
		.then(() => { selectionChanged.call(this, {point: {x: self.view.latestYear}}); })
		.catch(function(err){
			console.error(err);
		});
}

module.exports = Course;