import Feature from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as util from '../../../util.js';

export let loadXML = function (locationElement, context) {
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> museumPieces > item').each(function () {
		let tileX = +$(this).find('> key > Vector2 > X').first().text();
		let tileY = +$(this).find('> key > Vector2 > Y').first().text();
		
		$(this).find('> value > string').first().each(function () {
			let feature = new Feature(
				'museumPieces',
				tileX,
				tileY,
				util.getElementDetails(this)
			);
			context.features.push(feature);
			updateFeature(feature, context.location, context.core);
		});
	});
};

export let syncDetails = function (feature, location, core) {
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	let item = core.items.resolve(feature.details.$);
	
	feature.meta.name = item.displayName;
	feature.meta.item = item;
};

export let drawFeature = function (feature, location, core) {
	let lib = core.extensions.maps.lib;
	
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	
	let item = feature.meta.item;
	
	// See StardewValley.Locations.LibraryMuseum:draw()
	
	feature.drawBasicShadow([feature.tileX * 64 + 32, feature.tileY * 64 + 52], (zTileY * 64 - 2) / 10000);
	feature.drawSprite(item.texture, [feature.tileX * 64, feature.tileY * 64], item.spriteRect, null, 0, null, 4, Sprite.EF_NONE, zTileY * 64 / 10000);
};
