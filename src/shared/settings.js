let noneEnum = 'none';
let config = {
	name: 'TreantJS Extension',
	none: noneEnum,
	settingsKey: 'treantjs',
	configPopup: {
		url: 'config',
		size: {
			height: 500,
			width: 400
		}
	},
	ids: {
		treeContainer: 'tree-container'
	},
	colors: {
		'background': 'white'
	},
	defaults: {
		'data':{
			'worksheet': '',
			'nodeId': '',
			'nodeLabel': '',
			'parentId': '',
			'color': noneEnum,
		},
		'action':{
			'enabled': false,
			'field': '',
			'parameter': ''
		},
		'formatting': {
			'rootNodeOrientation': 'WEST',
			'verticalAlignment': 'TOP',
			'levelsToShow': 2
		}
	}
}

module.exports = config;