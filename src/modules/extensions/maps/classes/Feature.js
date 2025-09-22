import Sprite from './Sprite.js';

import * as util from '../../../util.js';

let accessories = {
	// The order of items in these arrays determines the priority for
	// removal, with later items being grabbed first.
	
	buildings: [
		'FishPond.sign',
		'FishPond.goldenAnimalCracker',
		'FishPond.neededItem',
		'FishPond.output',
	],
	furniture: [
		'heldObject',
	],
	objects: [
		'sprinklerUpgrade',
		'sprinklerTorch',
		'Fence.heldObject',
		'IndoorPot.crop',
		'readyForHarvest',
	],
};

let grabbableAccessories = {
	furniture: new Set([
		'heldObject',
	]),
	objects: new Set([
		'sprinklerTorch',
		'Fence.heldObject',
		'IndoorPot.crop',
	]),
};

export default class Feature {
	// Primary properties.
	
	kind;
	tileX;
	tileY;
	details;
	
	// Derived information populated by updateFeature(). This will be an
	// object of a kind-specific class, extending FeatureMeta.
	
	meta;
	
	// Sprite objects populated by drawFeature().
	
	sprites = [];
	
	// Bookkeeping maintained by the map engine.
	
	domainTileIndices = [];
	index = -1;
	maxLayerDepth = 0;
	obscuredBy = [];
	obscures = new Set();
	restorationDetails = null;
	warpIndex = null;
	
	static NOTE_RAW = 0;
	static NOTE_SPACE = 1;
	static NOTE_COMMA = 2;
	static NOTE_COLON = 3;
	static NOTE_SEMICOLON = 4;
	static NOTE_PARENS = 5;
	
	static notePrefixes = {
		[Feature.NOTE_RAW]: '',
		[Feature.NOTE_SPACE]: ' ',
		[Feature.NOTE_COMMA]: ', ',
		[Feature.NOTE_COLON]: ': ',
		[Feature.NOTE_SEMICOLON]: '; ',
		[Feature.NOTE_PARENS]: ' (',
	};
	
	static PAINT_TYPE_BUILDINGS = 1;
	static PAINT_TYPE_FARMER_BASE = 2;
	static PAINT_TYPE_FARMER_SLEEVES = 3;
	
	static paintTypeDefs = {
		[Feature.PAINT_TYPE_BUILDINGS]: {
			keys: [0xff0000, 0x00ff00, 0x0000ff],
		},
		[Feature.PAINT_TYPE_FARMER_BASE]: {
			refImages: [
				['skinColors', 'Characters/Farmer/skinColors'],
				['shirts', 'Characters/Farmer/shirts'],
				['shoeColors', 'Characters/Farmer/shoeColors'],
			],
			keyPixelIndices: [
				// See StardewValley.FarmerRenderer:ApplySkinColor()
				260, 261, 262,
				
				// See StardewValley.FarmerRenderer:ApplyShoeColor()
				268, 269, 270, 271,
				
				// See StardewValley.FarmerRenderer:ApplySleeveColor()
				256, 257, 258
			],
		},
	};
	
	constructor (kind, tileX, tileY, details) {
		this.kind = kind;
		this.tileX = tileX;
		this.tileY = tileY;
		this.details = details;
		this.clearMeta();
	}
	
	static from (feature) {
		return new Feature(feature.kind ?? 'special', feature.tileX ?? 0, feature.tileY ?? 0, window.structuredClone(feature.details ?? {}));
	}
	
	static createTemporal (tileX, tileY) {
		let feature = new Feature('special', tileX, tileY, {});
		feature.meta.temporal = true;
		feature.meta.passable = true;
		feature.meta.noMove = true;
		feature.meta.noErase = true;
		return feature;
	}
	
	addNote (text, style = Feature.NOTE_COLON) {
		this.meta.notes ??= [];
		this.meta.notes.push({
			text: text,
			style: style,
		});
	}
	
	getStyledNotes () {
		let notes = '';
		
		if (this.meta.notes != null) {
			for (let note of this.meta.notes) {
				switch (note.style) {
				case Feature.NOTE_PARENS:
					notes += ` (${note.text})`;
					break;
				
				default:
					notes += (Feature.notePrefixes[note.style] ?? '') + note.text;
				}
			}
		}
		
		return notes;
	}
	
	beginUpdate () {
		this.clearMeta();
	}
	
	endUpdate () {
		if (this.details['sp:added'] === 'true') {
			this.meta.noErase = false;
			this.meta.noMove = false;
		}
	}
	
	clearMeta () {
		this.meta = new (kindMetaClasses[this.kind] ?? UnknownMeta)();
	}
	
	getMinBuildingCount (location) {
		if (location.id === 'Farm') {
			switch (this.meta.buildingType) {
			case 'Pet Bowl':
			case 'Shipping Bin':
				return 1;
			}
		}
		
		return null;
	}
	
	isGrass () {
		return (this.kind === 'terrainFeatures' && this.meta.type === 'Grass');
	}
	
	hasCrop () {
		switch (this.kind) {
		case 'objects':
			return (this.meta.type === 'IndoorPot' && this.details.hoeDirt?.crop != null);
		
		case 'terrainFeatures':
			return (this.meta.type === 'HoeDirt' && this.details.crop != null);
		}
		
		return false;
	}
	
	//== Sprite Drawing ==//
	
	drawSpriteObject (sprite) {
		sprite.accessoryIndex = this.meta.currentAccessoryIndex;
		this.sprites.push(sprite);
		return sprite;
	}
	
	drawSprite (texture, position, sourceRect, tintColor, rotation, origin, scale, effects, layerDepth, properties = {}) {
		if (texture == null) {
			return null;
		}
		
		return this.drawSpriteObject(new Sprite(
			Sprite.TYPE_TEXTURE,
			texture,
			+(position?.[0] ?? 0) / 4 - +(origin?.[0] ?? 0) - this.tileX * 16,
			+(position?.[1] ?? 0) / 4 - +(origin?.[1] ?? 0) - this.tileY * 16,
			sourceRect?.x ?? sourceRect?.X,
			sourceRect?.y ?? sourceRect?.Y,
			sourceRect?.width ?? sourceRect?.Width ?? (this.meta.width * 16),
			sourceRect?.height ?? sourceRect?.Height ?? (this.meta.height * 16),
			tintColor,
			rotation,
			origin,
			+(scale ?? 4) / 4,
			effects,
			layerDepth,
			properties,
		));
	}
	
	drawRect (rect, tintColor, rotation, origin, scale, effects, layerDepth, properties = {}) {
		return this.drawSpriteObject(new Sprite(
			Sprite.TYPE_SOLID,
			null,
			+(rect?.x ?? rect?.X ?? 0) / 4 - +(origin?.[0] ?? 0) - this.tileX * 16,
			+(rect?.y ?? rect?.Y ?? 0) / 4 - +(origin?.[1] ?? 0) - this.tileY * 16,
			0,
			0,
			+(rect?.width ?? rect?.Width ?? (this.meta.width * 64)) / 4,
			+(rect?.height ?? rect?.Height ?? (this.meta.height * 64)) / 4,
			tintColor,
			rotation,
			origin,
			+(scale ?? 4) / 4,
			effects,
			layerDepth,
			properties,
		));
	}
	
	drawBasicShadow (drawPosition, layerDepth, scale = 4) {
		this.drawSprite(util.tx.shadowTexture, drawPosition, new util.Rect(0, 0, 12, 7), null, 0, [6, 3.5], scale, Sprite.EF_NONE, layerDepth, {isShadow: true});
	}
	
	drawTinyDigits (stack, position, scale, layerDepth, color) {
		// See StardewValley.Utility.drawTinyDigits()
		
		let numDigits = Math.floor(Math.log10(Math.max(1, stack))) + 1;
		let deltaX = 5 * scale - 1;
		let x = position[0] + deltaX * (numDigits - 1);
		
		// Note: We technically draw the digits in reverse order from what
		// Stardew Valley does, because it's simpler. Visually, there should
		// be no difference.
		
		for (let i = 0; i < numDigits; ++i) {
			this.drawSprite(util.tx.mouseCursors, [x, position[1]], new util.Rect(368 + (stack % 10) * 5, 56, 5, 7), null, 0, null, scale, Sprite.EF_NONE, layerDepth);
			x -= deltaX;
			stack = Math.floor(stack / 10);
		}
	}
	
	//== Accessories ==//
	
	getTopAccessory () {
		if (this.meta.maxAccessoryIndex < 0) {
			return null;
		}
		
		return accessories[this.kind][this.meta.maxAccessoryIndex];
	}
	
	getTopGrabbableAccessory () {
		if (this.meta.maxGrabbableAccessoryIndex < 0) {
			return null;
		}
		
		return accessories[this.kind][this.meta.maxGrabbableAccessoryIndex];
	}
	
	beginAccessory (accessory) {
		if (this.meta.currentAccessoryDepth === 0) {
			let accessoryIndex = accessories[this.kind]?.indexOf(accessory);
			
			if (accessoryIndex == null || accessoryIndex < 0) {
				throw new Error('Undefined accessory');
			}
			
			this.meta.currentAccessoryIndex = accessoryIndex;
			this.meta.maxAccessoryIndex = Math.max(this.meta.maxAccessoryIndex, accessoryIndex);
			
			if (grabbableAccessories[this.kind]?.has(accessory)) {
				this.meta.maxGrabbableAccessoryIndex = Math.max(this.meta.maxGrabbableAccessoryIndex, accessoryIndex);
			}
		}
		
		++this.meta.currentAccessoryDepth;
	}
	
	endAccessory () {
		--this.meta.currentAccessoryDepth;
		
		if (this.meta.currentAccessoryDepth === 0) {
			this.meta.currentAccessoryIndex = -1;
		}
	}
};

export class FeatureMeta {
	width = 1;
	height = 1;
	
	name = null;
	notes = null;
	type = null;
	
	noErase = false;
	noMove = false;
	
	currentAccessoryDepth = 0;
	currentAccessoryIndex = -1;
	maxAccessoryIndex = -1;
	maxGrabbableAccessoryIndex = -1;
	
	additionalTilePropertyRadius = 0;
	catalogueData = null;
	domainOffsetX = 0;
	domainOffsetY = 0;
	domainSize = 0;
	domainType = null;
	item = null;
	paintRegions = null;
	passable = false;
	pathTypes = null;
	temporal = false;
	tileProperties = null;
	warp = null;
};

export class BuildingMeta extends FeatureMeta {
	buildingType = null;
	collisionMap = null;
};

export class FurnitureMeta extends FeatureMeta {
	flipped = false;
	furnitureType = null;
	rotations = 0;
	sourceRect = null;
};

export class LargeTerrainFeatureMeta extends FeatureMeta {
};

export class MuseumPieceMeta extends FeatureMeta {
};

export class ObjectMeta extends FeatureMeta {
	artifactSpot = null;
	forageable = null;
};

export class ResourceClumpMeta extends FeatureMeta {
	seedId = null;
};

export class TerrainFeatureMeta extends FeatureMeta {
	dailyForageable = null;
	treeType = null;
};

export class SpecialMeta extends FeatureMeta {
};

export class UnknownMeta extends FeatureMeta {
};

let kindMetaClasses = {
	buildings: BuildingMeta,
	furniture: FurnitureMeta,
	largeTerrainFeatures: LargeTerrainFeatureMeta,
	museumPieces: MuseumPieceMeta,
	objects: ObjectMeta,
	resourceClumps: ResourceClumpMeta,
	terrainFeatures: TerrainFeatureMeta,
	special: SpecialMeta,
};
