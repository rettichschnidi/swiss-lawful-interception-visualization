function DataDivisions(Papa){
	var self = this;
	self.transformed = null;

	function init(){
		self.transformed = Promise.resolve($.ajax({
			url: 'data/data.csv'
		})).then(function transform(data){
			var parsedCsv = Papa.parse(data);
			parsedCsv.data[0].splice(0,3);
			var cantons = parsedCsv.data[0];
			var flat = [];
			parsedCsv.data.splice(0, 1);
			parsedCsv.data.map(function(row){
				var [superc, sub, year] = row;
				row.splice(0, 3);
				row.map((val, i) => {
					flat.push({
						'super': superc,
						'sub': sub,
						'canton': cantons[i].toLowerCase(),
						'value': val.length === 0 ? NaN : +val,
						'year': +year
					});
				});
			});
			return flat;
		}).catch((err)=>{
			console.error(err);
		});

		return self.transformed;
	}

	init.call(this).catch(err => {
		console.error(err);
	});
}

function unique(e, i, arr) {
    return arr.lastIndexOf(e) === i;
}
var fakeCantons = ['ch', 'ba'];
function byYear(year, e){
	if(year){
		return e.year === year;
	}
	return true;
}
function byCanton(canton, e){
	if(canton){
		return e.canton === canton;
	}
	return true;
}

function sumByYearCantonSuperSub(year, canton, _super, sub){
	return this.transformed.then(transformed => {
		var filtered = transformed.filter(r => {
			return r.sub === sub && r.super === _super;
		})
		.filter(byYear.bind(null, year))
		.filter(byCanton.bind(null, canton));
		if(filtered.length === 0){
			return NaN;
		}else{
			return filtered.reduce((sum, b) => {
				return sum + b.value;
			}, 0);
		}
	});
}

['kosten'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return sumByYearCantonSuperSub.call(this, year, canton, 'kanton', section);
	};
});

['aktiv', 'vds', 'techadm', 'telefonbuch'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return sumByYearCantonSuperSub.call(this, year, canton, 'typ', section);
	};
});

['oeFrieden', 'staat', 'sex', 'buepf', 'diverse', 'drogen', 'drohung', 'finanz', 'gewalt', 'vermoegen'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return sumByYearCantonSuperSub.call(this, year, canton, 'deliktegruppe', section);
	};
});

['post', 'internet', 'telefon', 'notsuche', 'antennensuchlauf'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return sumByYearCantonSuperSub.call(this, year, canton, 'art', section);
	};
});

['post', 'internet', 'festnetz', 'mobil'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return sumByYearCantonSuperSub.call(this, year, canton, 'technologie', section);
	};
});

['terror', 'paedo', 'krimorg', 'nachrichtendienst', 'geldwaesche', 'menschenhandel'].forEach(function(section){
	DataDivisions.prototype[section] = function(year, canton){
		return Promise.all([
			sumByYearCantonSuperSub.call(this, year, canton, 'schwerestraftaten', section),
			sumByYearCantonSuperSub.call(this, year, canton, 'schwerestraftaten', section+'_prozent')
		]);
	};
});

DataDivisions.prototype.cantons = function(){
	return this.transformed.then(transformed => {
		return transformed.filter(r => {
			return fakeCantons.indexOf(r.canton) === -1;
		}).map((r) => {
			return r.canton;
		})
		.filter(unique)
		.sort();
	});
};

DataDivisions.prototype.years = function(){
	return this.transformed.then(transformed => {
		return transformed.map(r => {
			return r.year;
		})
		.filter(unique)
		.sort();
	});
};

DataDivisions.prototype.fakeCantons = function(){
	return Promise.resolve(fakeCantons);
};

module.exports = DataDivisions;