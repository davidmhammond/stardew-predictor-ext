import Feature from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export let loadXML = function (locationElement, context) {
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> largeTerrainFeatures > LargeTerrainFeature').each(function () {
		let feature = new Feature(
			'largeTerrainFeatures',
			+$(this).find('tilePosition > X').first().text(),
			+$(this).find('tilePosition > Y').first().text(),
			util.getElementDetails(this)
		);
		context.features.push(feature);
		updateFeature(feature, context.location, context.core);
	});
};

export let syncDetails = function (feature, location, core) {
	feature.details.tilePosition ??= {};
	feature.details.tilePosition.X = feature.tileX + '';
	feature.details.tilePosition.Y = feature.tileY + '';
};

export let updateFeature = function (feature, location, core) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.maps;
	let baseUtil = core.baseUtil;
	let lib = core.extensions.maps.lib;
	
	feature.meta.type = feature.details['@xsi:type'] ?? null;
	
	switch (feature.meta.type) {
	case 'Bush': {
		feature.meta.name = 'Bush';
		feature.meta.noErase = true;
		feature.meta.noMove = true;
		let size = +feature.details.size;
		
		if (size === 3) {
			feature.meta.noErase = false;
		}
		else if (location.id === 'Farm') {
			switch (location.gameState.farmType) {
			case '2':
				if (feature.tileX === 13 && feature.tileY === 35) {
					feature.meta.noErase = false;
				}
				else if (feature.tileX === 37 && feature.tileY === 9) {
					feature.meta.noErase = false;
				}
				else if (feature.tileX >= 43 && feature.tileX < 77 && feature.tileY >= 11 && feature.tileY < 61) {
					feature.meta.noErase = false;
				}
				break;
			
			case '1':
				if (feature.tileX >= 32 && feature.tileX < 43 && feature.tileY >= 11 && feature.tileY < 36) {
					feature.meta.noErase = false;
				}
				break;
			
			case '3':
				if (feature.tileX >= 24 && feature.tileX < 34 && feature.tileY >= 56 && feature.tileY < 64) {
					feature.meta.noErase = false;
				}
				break;
			
			case '6':
				if (feature.tileX >= 20 && feature.tileX < 46 && feature.tileY >= 44 && feature.tileY < 88) {
					feature.meta.noErase = false;
				}
				break;
			}
		}
		
		switch (size) {
		case 0:
			feature.meta.name = 'Small Bush';
			break;
		
		case 1:
			feature.meta.name = 'Medium Bush';
			feature.meta.width = 2;
			
			// TODO: The berry production looks like it might be predictable in advance. Consider predicting it.
			
			break;
		
		case 2:
			feature.meta.width = 3;
			feature.meta.name = 'Large Bush';
			break;
		
		case 3:
			feature.meta.name = 'Tea Bush';
			feature.meta.noErase = false;
			feature.meta.item = core.items.get('O', '251');
			break;
		
		case 4:
			feature.meta.width = 2;
			feature.meta.name = 'Walnut Bush';
			break;
		}
		
		break;
	}
	case 'Tent':
		feature.meta.name = 'Tent';
		
		// Adjust the tent footprint to match the bounding box.
		
		feature.meta.width = 3;
		feature.meta.height = 2;
		break;
	}
};

export let drawFeature = function (feature, location, core) {
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	
	switch (feature.meta.type) {
	case 'Bush': {
		mapsUtil.drawBush(feature, location, core, feature.details, feature.tileX, feature.tileY);
		break;
	}
	case 'Tent': {
		feature.drawSprite(util.tx.mouseCursors_1_6, [feature.tileX * 64 - 64, feature.tileY * 64], new util.Rect(48, 208, 64, 48), null, 0, null, 4, Sprite.EF_NONE, .0001, {isShadow: true});
		feature.drawSprite(util.tx.mouseCursors_1_6, [feature.tileX * 64, feature.tileY * 64 - 128], new util.Rect(0, 192, 48, 64), null, 0, null, 4, Sprite.EF_NONE, zTileY * 64 / 10000);
		break;
	}}
};
