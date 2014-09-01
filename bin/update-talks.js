#!/usr/bin/env node
/*
 Update the talks to show in the agenda
 To execute: 

 npm install -g node-inspector
 node-debug bin/update-talks
*/

'use strict';

var AVATAR_SIZE = 100;
var FILENAME_MAX_SIZE = 30;

var GoogleSpreadsheets = require("google-spreadsheets")
  , _ = require("lodash")
  , fs = require("fs")
  , getValue = function(o) { 
    return o && o.value || ''
  }
  , getSplittedValue = function(s) {
    var values = getValue(s).split(','); // split by comma
    values = _.map(values, function(v) { return v.trim() }); // remove spaces
    return _.without(values, '') // remove empty values
  }
  , echoExec = function(command, options, callback) {
    // executes and logs the command
    console.log(command)
    return require('child_process').exec(command, options, callback)
  }
  , downloader = require('./image-downloader')
;

GoogleSpreadsheets({
    key: "1RHoQpagq_HazDkOtBQCdc-5df7knqqqvb_3ng7Ncj3I"
}, function(err, spreadsheet) {
    spreadsheet.worksheets[0].cells({
        range: "R2C1:R300C26"
    }, function(err, cells) {
      
      // transformar la hoja Excel en charlas
      var talks = [];
      _.forEach(cells.cells, function(row) {
        //console.log(row);
        var track = getValue(row['25']);
        if (track) {
          var title = getValue(row['17']);
          talks.push({
            'id': title.toLowerCase().trim().replace(/[^ a-zA-Z0-9\-_]+/g, '').replace(/ +/g, '-'),
            'author': getValue(row['2']),
            'language': getValue(row['4']),
            'tags': getSplittedValue(row['5']),
            'languages': getSplittedValue(row['6']),
            'slotType': getValue(row['8']),
            'description': getValue(row['9']).replace(/(\n *)+/g, '</p><p>'),
            'communities': _.compact([getValue(row['10']), getValue(row['11']), getValue(row['12'])]),
            'avatar': getValue(row['13']),
            'level': getValue(row['14']),
            'bio': getValue(row['16']).replace(/(\n *)+/g, '</p><p>'),
            'title': title,
            //'avatar2': getValue(row['19']), demasiado lío
            'date': getValue(row['24']),
            'track': track,
            'time': getValue(row['26']),
          })
        }
      });

      // sort the talks for the list view
      talks = _.sortBy(talks, function(talk) {
        return talk.date + '-' + talk.time + '-' + talk.track;
      })

      _.each(talks, function(talk) {
        if (talk.avatar) {
          var name = talk.id;
          if (name.length > FILENAME_MAX_SIZE) {
            name.substring(0, FILENAME_MAX_SIZE);
          }
          downloader.download({
            file: {
              url: talk.avatar,
              name: name
            },
            originalFilename: 'src/img/talks/orig/' + name + '{{extension}}',
            processedFilename: 'src/img/talks/processed/' + name + '.png',
            vectorToPng: 'inkscape --export-png="{{originalFilename}}" --export-height=' + AVATAR_SIZE + ' --export-width=' + AVATAR_SIZE + ' "{{processedFilename}}"',
            toPng: 'convert "{{originalFilename}}" -geometry ' + AVATAR_SIZE + 'x' + AVATAR_SIZE + ' "{{processedFilename}}"'
          }); 
          talk.avatar = '/img/talks/processed/' + name + '.png';
        }
      })

      var agendaHtml = _.template(
        '<ul class="row unstyled small-block-grid-1 medium-block-grid-2">' +
          '<% _.forEach(talks, function(talk) { %>' +
            '<li>' +
              '<article class="talk">' +
              '<% if (talk.avatar) { %>' +
                '<img class="th toright" src="{{talk.avatar}}">' +
              '<% } %>' + 
              '<h1>{{talk.title}}</h1>' +
              '<p>{{talk.description}}' +
                '<br><small>' +
                  'Author: {{talk.author}}' +
                  '<br>Tags:' +
                    '<% _.forEach(talk.tags, function(tag) { %>' +
                      ' <span class="radius label">{{tag}}</span>' +
                    '<% }); %>' +
                  '<br>Programming languages:' +
                    '<% _.forEach(talk.languages, function(lang) { %>' +
                      ' <span class="secondary round label">{{lang}}</span>' +
                    '<% }); %>' +
                  '<br>Date: {{talk.date}} at {{talk.time}}' +
                  '<br>Track: {{talk.track}}' +
                  '<br>Level: {{talk.level}}' +
                '</small>' +
              '</p>' +
              '</article>' +
            '</li>' +
          '<% }); %>' +
        '</ul>', {
          talks: _.chain(talks).filter(function(talk) {
            return talk.date == '2014-11-21';
          }).sortBy('title').value()
        }
      );
      // save the HTML with agenda of talks
      console.log("Writing list of talks at src/_includes/talks.html")
      fs.writeFile(
        'src/_includes/talks.html', 
        agendaHtml
      );
      // save the json with the array of talks
      console.log("Writing list of talks at src/js/talks/data.js")
      fs.writeFile(
        'src/js/talks/data.js', 
        '(function() { \'use strict\'; module.exports = ' + JSON.stringify(talks) + ';})()'
      );
    });
});