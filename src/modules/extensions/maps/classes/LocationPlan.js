import Feature from './Feature.js';

export default class LocationPlan {
	location;
	initialState = true;
	appliedWallpaper = {};
	appliedFloor = {};
	features = [];
	featureLookup = {
		museumPieces: {},
		objects: {},
		terrainFeatures: {},
	};
	
	constructor (location) {
		this.location = location;
	}
	
	getExportValues () {
		let out = {
			locationId: this.location.id,
			appliedWallpaper: this.appliedWallpaper,
			appliedFloor: this.appliedFloor,
			features: [],
		};
		
		for (let feature of this.features) {
			if (feature != null && !feature.meta.temporal) {
				// Include just the core feature information. The rest of the properties can be derived from this.
				
				out.features.push({
					kind: feature.kind,
					tileX: feature.tileX,
					tileY: feature.tileY,
					details: feature.details,
				});
			}
		}
		
		return out;
	}
	
	importValues (values) {
		this.initialState = values.initialState ?? false;
		this.appliedWallpaper = values.appliedWallpaper ?? {};
		this.appliedFloor = values.appliedFloor ?? {};
		
		for (let feature of values.features ?? []) {
			this.features.push(Feature.from(feature));
		}
	}
};
