#!/usr/bin/env node
/*
 Update the community logos in src/img/communities/ (orig and gray)
 If the logo file exists in orig, it will not be overwritten
 To execute: 

 npm install -g node-inspector
 node-debug bin/update-logos
*/

'use strict';

// maximum height of the logo, in pixels
var LOGO_MAX_HEIGHT = 120

var GoogleSpreadsheets = require("google-spreadsheets")
, http = require('http')
, fs = require('fs')
, _ = require("lodash")
, downloader = require('./image-downloader')
, getValue = function(o) { 
  return o && o.value || ''
}

// crea el fichero con los estilos CSS 
, createScss = function(communities) {
  var content = '// File generated by bin/update-logos\n' +
    '@import "_sprite";\n\n' +
    _.map(communities, function(community) {
      return community.logo? '.' + community.className + ' { @include sprite($' + community.className + '); }' : ''
    }).join('\n')

    console.log("Writing CSS selectors at src/scss/communities.scss")
    fs.writeFile('src/scss/communities.scss', content)
  
}

// crea el fichero de footer con los enlaces
, createFooter = function(communities) {
  var content = '<!-- File generated by bin/update-logos -->\n' +
    _.map(communities, _.template('<a href="{{url}}" class="community {{className}}" title="{{name}}">{{name}}</a> ')).join('\n');

    console.log("Writing the community links at src/_includes/communities.html")
    fs.writeFile('src/_includes/communities.html', content)
}

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

GoogleSpreadsheets({
    key: "1adoW5l62CtO0AgwobCIPjTcVhOPr7T1TSvVm2kdNP-E"
}, function(err, spreadsheet) {
    spreadsheet.worksheets[0].cells({
        range: "R2C1:R500C5"
    }, function(err, cells) {
      
      // transformar la hoja Excel en comunidades
      var communities = _.map(cells.cells, function(row) {
        var communityName = getValue(row['1'])
        return {
          // replaces all the characters that can give problems in a Scss file
          className: communityName.replace(/[^a-zA-Z0-9_\-]/g, '-'),
          name: communityName,
          url: getValue(row['2']),
          logo: getValue(row['3']).replace('https://', 'http://')
        }
      })

      // save the json with the array of communities
      console.log("Writing list of communities at src/communities.json")
      fs.writeFile('src/communities.json', JSON.stringify(communities))
      fs.writeFile('src/js/communities.js', 'exports.communities=' + JSON.stringify(communities) + ';')

      // save the file with all the CSS styles
      createScss(communities);

      // create the footer file with all communities
      createFooter(communities);

      // descargar las imágenes y procesarlas
      var processedCommunities = 0

      _.each(communities, function(community) {
        downloader.download({
          file: {
            url: community.logo,
            name: community.name,
          },
          originalFilename: 'src/img/communities/orig/' + community.className + '{{extension}}',
          processedFilename: 'src/img/communities/gray/' + community.className + '.png',
          vectorToPng: 'inkscape --export-png="{{processedFilename}}" --export-height=' + LOGO_MAX_HEIGHT + ' "{{originalFilename}}" && convert "{{processedFilename}}" -colorspace Gray "{{processedFilename}}"',
          toPng: 'convert "{{originalFilename}}" -colorspace Gray -geometry x' + LOGO_MAX_HEIGHT + ' "{{processedFilename}}"'
        }, function() {
          processedCommunities++;
        });
      });
      
    });
});