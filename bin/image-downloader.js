'use strict';

var http = require('http')
  , fs = require('fs')
  , _ = require("lodash")
;

var getExtension = function(url) {
  var parts = /\.[^.:\/]+$/.exec(url.replace(/\?.*/, ''))
  return parts || ''
}
, echoExec = function(command, options, callback) {
  // executes and logs the command
  console.log(command)
  return require('child_process').exec(command, options, callback)
}

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

module.exports = {
  // downloads a file from the Internet
  // transforms it
  // options:
  //    - file:
  //      - url
  //      - originalFileName
  //      - proccesedFileName
  //      - name
  //    - vectorToPng
  //    - toPng
  download: function(options, cb) {
    var file = options.file;
    var callback = cb || function(){};
    var extension = getExtension(file.url)
    , originalFilename = _.template(options.originalFilename, {
      extension: extension
    })

    // if url is not empty
    process.stdout.write("File download for " + file.name);
    if (!file.url || file.url.replace(/ /, "") == 'N/A') {
      console.log(" skipped (url is not defined)");
      callback();
      return
    } 

    // and we don't have it yet
    if (fs.existsSync(originalFilename)) {
      console.log(" skipped (file exists at " + originalFilename + ")");
      callback();
      return;
    }

    // download and do some magic
    console.log(" from " + file.url);
    http.get(file.url, function(response) {
      var originalFile = fs.createWriteStream(originalFilename);
      response.pipe(originalFile);
      originalFile.on('finish', function() {
        originalFile.close();
        var files = { 
          originalFilename: originalFilename, 
          processedFilename: options.processedFilename
        }

        if (extension == '.svg' || extension == '.ai' || extension == '.eps') {
          // vector to png
          echoExec(_.template(options.vectorToPng, files));
        } else {
          // jpg|png|whatever to png
          echoExec(_.template(options.toPng, files));
        }

        callback();
      
      });
    });
  }
}