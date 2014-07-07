(function($, window, document) {

  'use strict';

  require('./vendor/foundation/foundation');
  require('./vendor/foundation/foundation.topbar');
  require('./vendor/foundation/foundation.interchange');
  require('./vendor/foundation/foundation.tab');
  var _ = require('lodash');
  
  var communities = require('./communities').communities;

  require('./talks/agenda.js')

  var onWindowResize = function () {
     $('.picture-container').css({'height': $(window).height() - $('.top-bar').outerHeight() })
     var $pa = $('.picture-arrow')
     $pa.css({'left': ($(window).width() - $pa.outerWidth()) / 2})
   }

  // init foundation
  $(document).foundation();

  // resize page header on window resize
  if ($('.picture-container').length) {
    $(window).on('resize', _.throttle(onWindowResize, 50));
    onWindowResize();
  }

  // update the number of communities in the home page
  $('.communities-count').html(communities.length)

  // trigger render of talks in agenda page
  $('.js-talks').trigger('toggled')

  // link target to change locale
  $('.locale a').attr('href', function() { 
    return location.pathname.replace(/\/((es)|(en))\//, '/' + this.getAttribute('hreflang') + '/')
  })

})(jQuery, window, window.document)