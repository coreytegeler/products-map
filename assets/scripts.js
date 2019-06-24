var CLIENT_ID = '493611924506-bmc1qh4msbvhvpqmis5itmflolv7hmi8.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAgiVncefcj5PxwWej6KGTQzSkHwHhJGvw';
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
var spreadsheetId = '1axqksE6LOiVEWy8o-s0U7Xa-SEwdbi_ecfZddgU79qM';


var rasterId = 'cjw4bb2dl1rts1cngczbgd0p4';
var vectorId = 'cjw8l18xj25s61cnmvc82zxbe';
var accessToken = 'pk.eyJ1IjoiY29yZXl0ZWdlbGVyIiwiYSI6ImNpd25xNjU0czAyeG0yb3A3cjdkc2NleHAifQ.EJAjj38qZXzIylzax3EMWg';

var rasterUrl = 'https://api.mapbox.com/styles/v1/coreytegeler/'+rasterId+'/tiles/{z}/{x}/{y}?access_token='+accessToken;
var vectorUrl = 'https://api.mapbox.com/styles/v1/coreytegeler/'+vectorId+'/tiles/{z}/{x}/{y}?access_token='+accessToken;

var tileUrls = {
	satellite: 'https://api.mapbox.com/styles/v1/coreytegeler/'+rasterId+'/tiles/{z}/{x}/{y}?access_token='+accessToken,
	vector: 'https://api.mapbox.com/styles/v1/coreytegeler/'+vectorId+'/tiles/{z}/{x}/{y}?access_token='+accessToken
}

var map, tiles, rows, headers, entries;

var body = document.querySelector('body');

function openPopup(e) {
	e.target._icon.classList.add('active');
}

function closePopup(e) {
	e.target._icon.classList.remove('active');
}

function plotPoint(pointObj) {
	var lat = pointObj[6];
	var lng = pointObj[7];
	if(lat&&lng) {
		var coordsArr = [lat, lng];
		var coords = [Number(coordsArr[0]), Number(coordsArr[1])];
		var popupHtml = `<div class="popup-label">${pointObj[2]}</div>`;
		var props = {};
		console.log(coordsArr);
		var markerHtml = `<div class="marker-label"><div class="marker-label-inner">${pointObj[2]}</div><div class="leaflet-popup-tip-container"><div class="leaflet-popup-tip"></div></div></div>`;
		var markerIcon = L.divIcon({
			className: 'marker',
			iconSize: 30,
			html: markerHtml
		});
		var marker = L.marker(coords, {
			icon: markerIcon
		});
		marker.addTo(map);
		pointObj.forEach(function(field, i) {
			if(i && field) {
				var header = headers[i];
				popupHtml += `<div class="popup-field"><div class="popup-field-label">${header}</div><div class="popup-field-value">${field}</div></div>`;
				props[header] = field;
				// marker._icon.attribu[slugify(header)] = field;
				marker._icon.setAttribute('data-'+slugify(header), slugify(field));
				// console.log(slugify(header), marker);
			}
		});

		var popup = marker.bindPopup(popupHtml);
		popup.on('popupopen', openPopup);
		popup.on('popupclose', closePopup);
		return marker;
	}
}

function plotPoints() {
	var markers = [];
	rows.forEach(function(row) {
		var marker = plotPoint(row);
		markers.push(marker);
	});
	var markersGroup = new L.featureGroup(markers);
	map.fitBounds(markersGroup.getBounds());
}

function importPolygons(url, styles) {
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(e) {
		if (this.readyState == 4 && this.status == 200) {
			var response = JSON.parse(this.response);
			var outline = L.geoJSON(response, {
				style: styles
			}).addTo(map);
			outline.setStyle({'fill-color': 'black'});
		}
	};
	xhr.open('GET', url, true);
	xhr.send();

	// console.log(outline);
	// outline.addTo(map);
}

function createMap() {
	map = L.map('map').setView([40.648183,-73.9722937], 5);
	tiles = L.tileLayer(tileUrls['satellite'], {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	plotPoints();
}

function filterMarkers(e) {
	var value = e.target.value;
	var name = e.target.name;
	var markers = document.querySelectorAll('.marker');
	markers.forEach(function(marker) {
		if(marker.getAttribute('data-'+slugify(name)) == value || value == 'all') {
			marker.classList.remove('hide');
		} else {
			marker.classList.add('hide');
		}
	});
}

function toggleLayer(e) {
	var id = e.target.value;
	map.getContainer().setAttribute('data-layer', id);
	tiles.setUrl(tileUrls[id]);
}

function createFilter() {
	var forms = document.querySelectorAll('form');
	forms.forEach(function(form) {
		form.addEventListener('change', function(e) {
			var id = form.getAttribute('id');
			switch(id) {
				case 'filters':
					filterMarkers(e);
					break;
				case 'layers':
					toggleLayer(e);
					break;
			}
		});
	})
}

function handleData() {
	headers = rows[0];
	rows.shift();
	createMap();
	createFilter();
}

function makeApiCall() {
	var params = {
		spreadsheetId: spreadsheetId,
		range: 'A:Z',
		majorDimension: 'ROWS'
	};

	var request = gapi.client.sheets.spreadsheets.values.get(params);
	request.then(function(response) {
		rows = response.result.values;
		handleData();
	}, function(reason) {
		console.error('error: ' + reason.result.error.message);
	});
}


function initClient() {
	gapi.client.init({
		'apiKey': API_KEY,
		'clientId': CLIENT_ID,
		'scope': SCOPE,
		'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
	}).then(function() {
		makeApiCall();
	});
}

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function slugify(string) {
	return string
		.toLowerCase()
		.replace(/ /g,'-')
		.replace(/[^\w-]+/g,'-');
}