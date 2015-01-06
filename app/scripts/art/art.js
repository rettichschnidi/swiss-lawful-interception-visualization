function Art(dataDivisions, filter, CompoundObserver){
	var self = this;
	self.activ = null;

	function init(){
		return Promise.resolve();
	}

	function controller(){
		var observer = new CompoundObserver();
		observer.addPath(filter, 'year');
		observer.addPath(filter, 'canton');
		observer.open(function(newValues){

			Promise.all([
				dataDivisions.activ(newValues[0], newValues[1]),
				dataDivisions.vorratsdaten(newValues[0], newValues[1]),
				dataDivisions.telefonbuch(newValues[0], newValues[1])
			]).then(function(resolved){
				self.activ = resolved[0];
				self.vorratsdaten = resolved[1];
				self.telefonbuch = resolved[2];
				render.call(self);
			});
		});
	}

	function render(){
		var template = require('./art.jade');
		var html = template({activ: self.activ, vorratsdaten: self.vorratsdaten, telefonbuch: self.telefonbuch});
		$('#art').html(html);
		return Promise.resolve();
	}

	init.call(this)
		.then(render.bind(this))
		.then(controller.bind(this));
}

module.exports = Art;