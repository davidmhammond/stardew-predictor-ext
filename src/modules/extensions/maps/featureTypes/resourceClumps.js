import Feature from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as util from '../../../util.js';

let names = {
	600: 'Large Stump',
	602: 'Large Log',
	622: 'Meteorite',
	672: 'Boulder', // Farm boulder
	752: 'Boulder', // Mine boulder (levels 1-39, 81-119)
	754: 'Boulder', // Mine boulder (levels 1-39, 81-119)
	756: 'Boulder', // Mine boulder (levels 41-79)
	758: 'Boulder', // Mine boulder (levels 41-79)
	148: 'Boulder', // Quarry mine boulder (normally uses texture TileSheets/Objects_2)
};

export let loadXML = function (locationElement, context) {
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> resourceClumps > ResourceClump').each(function () {
		let feature = new Feature(
			'resourceClumps',
			+$(this).find('tile > X').first().text(),
			+$(this).find('tile > Y').first().text(),
			util.getElementDetails(this)
		);
		context.features.push(feature);
		updateFeature(feature, context.location, context.core);
	});
};

export let syncDetails = function (feature, location, core) {
	feature.details.tile ??= {};
	feature.details.tile.X = feature.tileX + '';
	feature.details.tile.Y = feature.tileY + '';
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	feature.meta.width = +feature.details.width;
	feature.meta.height = +feature.details.height;
	feature.meta.type = feature.details['@xsi:type'] ?? null;
	
	switch (feature.meta.type) {
	case 'GiantCrop': {
		let data = core.content.Data.GiantCrops[feature.details.id];
		let parts = util.parseItemId(data.FromItemId);
		let item = core.items.get(parts[0], parts[1]);
		feature.meta.name = `Giant ${item.displayName}`;
		feature.meta.item = item;
		feature.meta.domainType = 'harvest';
		
		for (let [seedId, crop] of Object.entries(core.content.Data.Crops)) {
			if (crop.HarvestItemId === item.itemId) {
				feature.meta.seedId = seedId;
				break;
			}
		}
		
		break;
	}
	default: {
		let parentSheetIndex = +feature.details.parentSheetIndex;
		feature.meta.name = names[parentSheetIndex];
	}}
};

export let drawFeature = function (feature, location, core) {
	let lib = core.extensions.maps.lib;
	
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	
	switch (feature.meta.type) {
	case 'GiantCrop': {
		let data = core.content.Data.GiantCrops[feature.details.id];
		feature.drawSprite(data.Texture, [feature.tileX * 64, feature.tileY * 64 - 64], new util.Rect(data.TexturePosition.X, data.TexturePosition.Y, 16 * data.TileSize.X, 16 * (data.TileSize.Y + 1)), null, 0, null, 4, Sprite.EF_NONE, (zTileY + data.TileSize.Y) * 64 / 10000);
		break;
	}
	default: {
		let parentSheetIndex = +feature.details.parentSheetIndex;
		let texture = util.normalizeTexture(feature.details.textureName ?? util.tx.objectSpriteSheet);
		let sourceRect = util.getStandardTextureRect(util.textureSizes[texture], parentSheetIndex, 16, 16);
		sourceRect.width = feature.meta.width * 16;
		sourceRect.height = feature.meta.height * 16;
		feature.drawSprite(texture, [feature.tileX * 64, feature.tileY * 64], sourceRect, null, 0, null, 4, Sprite.EF_NONE, (zTileY + 1) * 64 / 10000 + zTileX / 100000);
	}}
};
