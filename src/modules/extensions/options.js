import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.options;
	let baseUtil = core.baseUtil;
	let lib = this.lib;
	
	let colorModes = [
		'normal',
		'multiply',
		'screen',
		'overlay',
		'darken',
		'lighten',
		'color-dodge',
		'color-burn',
		'hard-light',
		'soft-light',
		'difference',
		'exclusion',
		'hue',
		'saturation',
		'color',
		'luminosity',
	];
	
	core.addPageInitializer(function () {
		$('#footer').prepend(`<div id="options-open" style="display: none;">The Options tab is hidden. You can open it here: <a href="#sec-options" onclick="$('#tab-options').prop('checked', true).trigger('change'); return false;">Options</a></div>`);
	});
	
	core.addBackgroundPredictor(function () {
		for (let predictor of core.predictors.values()) {
			let id = predictor.tabId;
			lib.applyTab(id, lib.getTab(id));
		}
		
		for (let writer of core.summaryWriters) {
			let id = writer.summaryId;
			lib.applySummary(id, lib.getSummary(id));
		}
		
		for (let writer of core.todaySummaryWriters) {
			let id = writer.todaySummaryId;
			lib.applyTodaySummary(id, lib.getTodaySummary(id));
		}
		
		for (let id of core.extensionIds) {
			lib.applyExtension(id, lib.getExtension(id));
		}
	});
	
	core.addPredictor('options', 'Options', function (isSearch, offset, extra) {
		let output = '';
		
		output += '<div style="display: flex; flex-wrap: wrap; gap: 25px; margin-bottom: 15px;">';
		output += '<div style="flex: 1; display: flex; flex-direction: column; gap: 25px;">';
		
		// Tabs.
		
		output += '<table id="options-tabs" class="output highlight-row"><thead><tr>';
		output += '<th>Tab</th>';
		output += '<th style="width: 5em;">Show</th>';
		output += '<th>Color</th>';
		output += '<th>Color Mode</th>';
		output += '</tr></thead><tbody>';
		
		let predictorList = core.predictors.values().toArray();
		predictorList.sort(function (a, b) {
			return a.tabName.localeCompare(b.tabName);
		});
		
		for (let predictor of predictorList) {
			let id = predictor.tabId;
			let tab = lib.getTab(id);
			
			output += '<tr>';
			output += `<td style="text-align: left;">${util.escapeHTML(predictor.tabName)}</td>`;
			output += `<td><input type="checkbox" id="options-tabs-show:${util.escapeHTML(id)}" ${tab.show ? 'checked' : ''}></td>`;
			output += `<td><input type="color" id="options-tabs-color:${util.escapeHTML(id)}" value="${tab.color}"></td>`;
			output += `<td><select id="options-tabs-colorMode:${util.escapeHTML(id)}">`;
			output += `<option value="" ${tab.colorMode === '' ? 'selected' : ''}>(None)</option>`;
			
			for (let colorMode of colorModes) {
				output += `<option ${tab.colorMode === colorMode ? 'selected' : ''}>${util.escapeHTML(colorMode)}</option>`;
			}
			
			output += '</select></td>';
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		
		output += '</div>';
		output += '<div style="flex: 1; display: flex; flex-direction: column; gap: 25px;">';
		
		// Summaries.
		
		output += '<table id="options-summaries" class="output highlight-row"><thead><tr>';
		output += '<th>Summary</th>';
		output += '<th style="width: 5em;">Show</th>';
		output += '</tr></thead><tbody>';
		
		core.sortOrderables(core.summaryWriters);
		
		for (let writer of core.summaryWriters) {
			let id = writer.summaryId;
			let summary = lib.getSummary(id);
			
			output += '<tr>';
			output += `<td style="text-align: left;">${util.escapeHTML(writer.name)}</td>`;
			output += `<td><input type="checkbox" id="options-summaries-show:${util.escapeHTML(id)}" ${(summary.show ?? true) ? 'checked' : ''}></td>`;
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		
		// Today's Summaries.
		
		output += '<table id="options-today-summaries" class="output highlight-row"><thead><tr>';
		output += '<th>Today\'s Summary</th>';
		output += '<th style="width: 5em;">Show</th>';
		output += '</tr></thead><tbody>';
		
		core.sortOrderables(core.todaySummaryWriters);
		
		for (let writer of core.todaySummaryWriters) {
			let id = writer.todaySummaryId;
			let todaySummary = lib.getTodaySummary(id);
			
			output += '<tr>';
			output += `<td style="text-align: left;">${util.escapeHTML(writer.name)}</td>`;
			output += `<td><input type="checkbox" id="options-today-summaries-show:${util.escapeHTML(id)}" ${(todaySummary.show ?? true) ? 'checked' : ''}></td>`;
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		
		// Extensions.
		
		output += '<div>Enabling/disabling extensions will take effect after reloading the page.</div>';
		output += '<table id="options-extensions" class="output highlight-row"><thead><tr>';
		output += '<th>Extension</th>';
		output += '<th style="width: 5em;">Enable</th>';
		output += '</tr></thead><tbody>';
		
		let extensionIds = [...core.extensionIds];
		extensionIds.sort(function (a, b) {
			return a.localeCompare(b);
		});
		
		for (let id of extensionIds) {
			let extension = lib.getExtension(id);
			
			output += '<tr>';
			output += `<td style="text-align: left;">${util.escapeHTML(id)}</td>`;
			output += `<td><input type="checkbox" id="options-extensions-enabled:${util.escapeHTML(id)}" ${extension.enabled ? 'checked' : ''} ${(id === 'options' && extension.enabled) ? 'disabled' : ''}></td>`;
			output += '</tr>';
		}
		
		output += '</tbody></table>';
		
		output += '</div>';
		
		return {
			output: output,
			afterUpdate: function () {
				$('#options-tabs input, #options-tabs select').on('change', function (e) {
					lib.updateTabs();
				});
				
				$('#options-summaries input').on('change', function (e) {
					lib.updateSummaries();
				});
				
				$('#options-today-summaries input').on('change', function (e) {
					lib.updateTodaySummaries();
				});
				
				$('#options-extensions input').on('change', function (e) {
					lib.updateExtensions();
				});
			},
		};
	});
	
	// Tabs.
	
	lib.getTab = function (tabId) {
		let tab = {...core.options.tabs?.[tabId]};
		tab.show ??= true;
		tab.color ??= '#ffffff';
		tab.colorMode ??= '';
		return tab;
	};
	
	lib.applyTab = function (tabId, tab) {
		$(`#tab-${tabId}, #tab-${tabId} + label`).toggle(tab.show);
		$(`#tab-${tabId} + label`)
			.css('--color', tab.color)
			.css('--colorMode', tab.colorMode)
			.toggleClass('colored', tab.colorMode !== '');
		
		if (tabId === 'options') {
			$('#options-open').toggle(!tab.show);
		}
	};
	
	lib.updateTabs = function () {
		let optionValue = (core.options.tabs ?? {});
		
		for (let predictor of core.predictors.values()) {
			let id = predictor.tabId;
			let tab = lib.getTab(id);
			
			tab.show = document.getElementById(`options-tabs-show:${id}`).checked;
			tab.color = document.getElementById(`options-tabs-color:${id}`).value;
			tab.colorMode = document.getElementById(`options-tabs-colorMode:${id}`).value;
			
			optionValue[id] = tab;
			lib.applyTab(id, tab);
		}
		
		core.setOption('tabs', optionValue);
	};
	
	// Summaries.
	
	lib.getSummary = function (summaryId) {
		let summary = {...core.options.summaries?.[summaryId]};
		summary.show ??= true;
		return summary;
	};
	
	lib.applySummary = function (summaryId, summary) {
		$(document.getElementById(`summary-${summaryId}`)).toggle(summary.show);
	};
	
	lib.updateSummaries = function () {
		let optionValue = (core.options.summaries ?? {});
		
		for (let writer of core.summaryWriters) {
			let id = writer.summaryId;
			let summary = lib.getSummary(id);
			
			summary.show = document.getElementById(`options-summaries-show:${id}`).checked;
			
			optionValue[id] = summary;
			lib.applySummary(id, summary);
		}
		
		core.setOption('summaries', optionValue);
	};
	
	// Today's Summaries.
	
	lib.getTodaySummary = function (todaySummaryId) {
		let todaySummary = {...core.options.todaySummaries?.[todaySummaryId]};
		todaySummary.show ??= true;
		return todaySummary;
	};
	
	lib.applyTodaySummary = function (todaySummaryId, todaySummary) {
		$(document.getElementById(`today-summary-${todaySummaryId}`)).toggle(todaySummary.show);
	};
	
	lib.updateTodaySummaries = function () {
		let optionValue = (core.options.todaySummaries ?? {});
		
		for (let writer of core.todaySummaryWriters) {
			let id = writer.todaySummaryId;
			let todaySummary = lib.getTodaySummary(id);
			
			todaySummary.show = document.getElementById(`options-today-summaries-show:${id}`).checked;
			
			optionValue[id] = todaySummary;
			lib.applyTodaySummary(id, todaySummary);
		}
		
		core.setOption('todaySummaries', optionValue);
	};
	
	// Extensions.
	
	lib.getExtension = function (extensionId) {
		let extension = {...core.options.extensions?.[extensionId]};
		extension.enabled ??= true;
		return extension;
	};
	
	lib.applyExtension = function (extensionId, extension) {
	};
	
	lib.updateExtensions = function () {
		let optionValue = (core.options.extensions ?? {});
		
		for (let id of core.extensionIds) {
			let extension = lib.getExtension(id);
			
			extension.enabled = document.getElementById(`options-extensions-enabled:${id}`).checked;
			
			optionValue[id] = extension;
			lib.applyExtension(id, extension);
		}
		
		core.setOption('extensions', optionValue);
	};
};
