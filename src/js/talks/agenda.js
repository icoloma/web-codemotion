(function() {

  'use strict';

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||  window.oRequestAnimationFrame || function(f) { _.delay(f, 1000/60) }
    , _ = require('../vendor/lodash-2.4.1.min')
    // extract a URL GET parameter value
    , getUrlParameter = function(name) {

      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(location.search);
      return !results? "" : decodeURIComponent(results[1].replace(/\+/g, " "));

    }
    , talks = require('./data.js')
    , recommended = (getUrlParameter('recommended') || '').split(',')
    , favorites = JSON.parse((window.localStorage && window.localStorage.getItem('favorites')) || '[]')
    , talkByKey = _.reduce(talks, function(result, talk) {
      talk.key = talk['date'] + 'T' + talk['time'] + '-' + talk.track
      result[talk.key] = talk
      return result
    }, {})
    // active filters
    , filters = {
      tag: [],
      lang:  '',
      language: '',
      level: '',
    }
    , schedules = [
      { time: '08:00', endTime: '09:00', value: 'REGISTER AND PICK UP YOUR BADGE' },
      { time: '09:00', endTime: '09:45', value: 'KEYNOTE' },
      { time: '09:45', endTime: '10:30' },
      { time: '10:45', endTime: '11:30' },
      { time: '11:30', endTime: '12:15', value: 'COFEE BREAK' },
      { time: '12:15', endTime: '13:00' },
      { time: '13:15', endTime: '14:00' },
      { time: '14:00', endTime: '15:30', value: 'LUNCH' },
      { time: '15:30', endTime: '16:15' },
      { time: '16:30', endTime: '17:15' },
      { time: '17:30', endTime: '18:15' },
      { time: '18:30', endTime: '20:30', value: 'NETWORKING BEER' }
    ]
    , updateHash = function(talkId) {
      if (window.history && history.pushState) {
        history.pushState({}, document.title, 'agenda.html' + 
          (recommended.length? '?recommended=' + recommended : '') +
          $('.tab-title.active > a').attr('href') + (talkId? '/' + talkId : ''));
      }
    }
    , imports = {

      // imports for lo-dash templates

      imports: {
        concatTags: function(tagArray, className) {
          return _.map(tagArray, function(tag) { 
            return '<span class="' + (className || '') + ' label">' + tag + '</span>';
          }).join(' ');
        }
      }

    }
    , renderScheduleTable = function(tableClass, tracks) {
      return _.template(
          '<table class="agenda-table {{tableClass}}"><thead><tr>' + 
            '<th></th>' +
            '<% _.forEach(tracks, function(track) { %>' +
              '<th class="text-center">{{ track }}</th>' +
            '<% }); %>' +
          '</tr></thead><tbody>' +
            '<% _.forEach(schedules, function(schedule, scheduleIndex) { %>' +
              '<tr>' +
                '<td class="schedule-time">{{schedule.time}}-{{schedule.endTime}}</td>' +
                '<% if (schedule.value) { %>' + 
                  '<td colspan="{{colspan}}" class="text-center break">{{schedule.value}}</td>' +
                '<% } else { %>' +
                  '<% _.forEach(tracks, function(track, index) { %> ' +
                    '<% if (schedule.talks[track]) { var talk = schedule.talks[track]; %>' +
                      '<td data-talk-id="{{ talk.id }}" class="text-center agenda-cell ' +
                        '<% if (talk.slotType == "Workshop (2 hours)") { %>workshop<% } %> ' +
                        '<% if (favorites.indexOf(talk.id) > -1) { %>favorited<% } %> ' +
                        '<% if (recommended.indexOf(talk.id) > -1) { %>recommended<% } %> ' +
                      '">' +
                        '<div class="text-right">' +
                          '<span class="icon-recommended icon-heart" title="Recommended by friends"></span> ' +
                          '<a class="added-to-favorites"><span class="icon-star" aria-label="Click to remove from favorites"></span></a> ' +
                          '<a class="add-to-favorites"><span class="icon-star-empty" aria-label="Click to add to favorites"></span></a> ' +
                          '</div>' +
                        '<span><a class="talk-a" data-talk-id="{{ talk.id }}" data-talk-key="{{ talk.key }}">{{talk.title}}</a></span><br>' +
                        '<span>{{talk.author}}</span>' +
                      '</td>' +
                    '<% } else { %>' +
                      '<td class="agenda-cell"></td>' + 
                    '<%} %>' +
                  '<% }); %>' +
                '<% } %>' +
              '</tr>' +
            '<% }); %>' +
          '</tbody></table>', {
          tableClass: tableClass,
          colspan: tracks.length,
          schedules: schedules,
          tracks: tracks,
          favorites: favorites,
          recommended: recommended
        });
    }
    , views = {
      asList: function(talksCollection) {
        return _.template(
          '<div class="columns">' +
          '<p data-alert class="alert-box">Talks will last <b>40 minutes + 5 Q&A</b>. Workshops will last <b>one hour and 45 minutes</b>.</p>' +
          '<ul class="unstyled small-block-grid-1 medium-block-grid-2">' +
          '<% _.forEach(talks, function(talk) { %>' +
            '<li>' +
              '<article class="talk">' +
              '<% if (talk.avatar) { %><img class="th toright avatar" src="{{talk.avatar}}"><% } %>' + 
              '<% if (talk.avatar2) { %><img class="th toright avatar" src="{{talk.avatar2}}"><% } %>' + 
              '<h1>{{talk.title}}</h1>' +
              '<p class="cright">{{{talk.description}}}' +
                '<br><small>' +
                  'Author: {{talk.author}} &middot; <b>{{talk.time}} {{talk.track}}</b>' +
                  '<br>' +
                    '<span class="secondary label {{talk.level}}"> {{talk.level}}</span> ' +
                    '{{{concatTags(talk.tags, "radius")}}} ' +
                    '{{{concatTags(talk.languages, "secondary round")}}} ' +
                '</small>' +
              '</p>' +
              '</article>' +
            '</li>' +
          '<% }); %>' + 
        '</ul></div>', { 
          talks: talksCollection
        }, imports);
      }

      , asGrid: function(talksCollection) {
        schedules = _.map(schedules, function(schedule) {
          var talks = _.filter(talksCollection, function(talk) {
            return schedule.time === talk.time;
          });
          schedule.talks = _.indexBy(talks, 'track');
          return schedule;
        });
        
        return '<div class="columns">' + 
          '<h1>Talks</h1>' + 
          '<p data-alert class="alert-box">Talks will last <b>40 minutes + 5 Q&A</b>. You will have an additional 15 minutes to change rooms for the next track.' +
          renderScheduleTable('talks-grid', ['Track 1','Track 2','Track 3','Track 4','Track 5','Track 6','Track 7','Track 8']) +
          '<h2>Workshops</h2>' + 
          '<p data-alert class="alert-box">Workshops will last <b>one hour and 45 minutes</b>.' +
          renderScheduleTable('workshops-grid', ['Track A','Track B']) +
          '</div>'
      }
    }
    , render = function() {
      //var tabId = $(arguments[0].target).find('.active a').attr('href').substring(1);
      updateHash();

      var filteredTalks = talks;
      if (filters.tag.length) {
        filteredTalks = _.filter(filteredTalks, function(talk) {
          return _.every(filters.tag, function(tag) { 
            return _.contains(talk.tags, tag); 
          });
        });
      }
      if (filters.lang) {
        filteredTalks = _.filter(filteredTalks, function(talk) {
          return talk.language === filters.lang;
        });
      }
      if (filters.language) {
        filteredTalks = _.filter(filteredTalks, function(talk) {
          return _.contains(talk.languages, filters.language);
        });
      }
      if (filters.level) {
        filteredTalks = _.filter(filteredTalks, function(talk) {
          return !filters.level || filters.level === talk.level;
        });
      }
      var $container = $('.tabs-content .active').empty()
        , currentDate = $container.data('date')
      ;
      filteredTalks = _.filter(filteredTalks, function(talk) {
        return talk.date === currentDate;
      });
      if (filteredTalks.length) {
        var view = views[$('.js-template.selected').data('view')];
        $container.html(view(filteredTalks));

        // remove the break from the workshop, for presentation reasons
        var $tr = $('.workshops-grid > tbody > tr:last-child');
        $tr.find('.break').removeClass('break').empty()

        // add the wrap-up text
        if (currentDate === '2014-11-22') {
          $('.talks-grid > tbody > tr:last-child > td:last-child').html('WRAP-UP (ON TRACK 1)');

          // adelantar la mañana 15 minutos por la competición de cross
          // arderé en el infierno por estas diez líneas de código...
          $('.schedule-time').each(function() {
            var $this = $(this)
            , inc15 = function(hour, minute) {
              return parseInt(minute) === 0? (parseInt(hour) - 1) + ':45' : hour + ':' + ((parseInt(minute) - 15) || '00'); 
            }
            , text = $this.text()
            , parts = /(\d\d):(\d\d)-(\d\d):(\d\d)/.exec(text)
            if (parseInt(parts[1]) < 15) {
              var newText = inc15(parts[1], parts[2]) + '-' + (text === '14:00-15:30'? '15:30' : inc15(parts[3], parts[4]));
              $this.text(newText);
            }
          })
        } 

      } else {
        $container.html('<div class="columns"><div class="panel callout radius">No results found</div></div>');
      }
    }
  ;

  _.templateSettings.interpolate = /\{\{\{([^}]+?)\}\}\}/g;
  _.templateSettings.escape = /\{\{([^\{][^}]+?)\}\}/g;

  var generatedFilters = [{
    name: 'tag',
    prop: 'tags'
  }, {
    name: 'language',
    prop: 'languages'
  }];
  _.each(generatedFilters, function(filter) {
    var $filter = $('.' + filter.name + '-filter')
      , values = _.chain(talks)
          .flatten(filter.prop)
          .map(function(s) { return s.trim() })
          .sortBy(function(value) {
            return value.toLowerCase();
          })
          .uniq(true)
          .value()
    ;
    _.each(values, function(val) {
      $filter.append(_.template(
        '<li><a class="label secondary" data-{{filter}}="{{value}}">{{value}}</a></li>', {
          filter: filter.name,
          value: val
        }
      ));
    });
  });

  $('.tag-filter').click(function(e) {
    e.preventDefault();
    var $this = $(e.target)
      , value = $this.data('tag')
      , selectedClass = 'secondary'
    ;
    if ($this.hasClass(selectedClass)) {
      filters.tag.push(value);
      $this.removeClass(selectedClass);
    } else {
      _.pull(filters.tag, value);
      $this.addClass(selectedClass);
    }
    render();
  });

  $('.js-template').click(function(e) {
    e.preventDefault();
    $('.js-template').removeClass('selected');
    $(e.target).addClass('selected');
    render();
  });

  var filtersAsRadioListeners = [ 'level', 'lang', 'language' ];

  _.each(filtersAsRadioListeners, function(filterListener) {

    // filter listener
    $('.' + filterListener + '-filter').click(function(e) {
      e.preventDefault();
      var $this = $(e.target)
        , value = $this.data(filterListener)
        , selectedClass = 'secondary'
        , isSelected = filters[filterListener] === value
      ;
      $('.' + filterListener + '-filter .label').addClass(selectedClass);
      if (!isSelected) {
        filters[filterListener] = value;
        $this.removeClass(selectedClass);
      } else {
        filters[filterListener] = '';
      }
      render();
    });

  });

  $('.js-talks').on('toggled', render);

  $(document).on('click', '.talk-a', function(e) {
    var $a = $(e.currentTarget)
    , talk = talkByKey[$a.data('talk-key')]

    if ($a.is('.talk-active a')) {
      $('.preview-contents').addClass('zoomed out');
      $('.talk-active').removeClass('talk-active');

      var $preview = $('.preview');

      // polyfilled if necessary
      _.delay(function() {
        $preview.remove();
      }, 250)
    } else {

      $('.preview').remove();
      $('.talk-active').removeClass('talk-active');

      $a.closest('td').addClass('talk-active');

      var $tr = $(e.currentTarget).closest('tr');
      $tr.after(_.template(
        '<tr class="preview {{clazz}}" data-talk-id="{{ talkId }}"><td></td><td colspan="{{colspan}}">' +
          '<div class="preview-contents zoomed">' +
            '<div class="small-6 columns">' +
              '<h5>{{title}} <small>by {{author}}</small></h5>' +
              '<p>{{{description}}}</p>' +
            '</div>' +
            '<div class="small-6 columns">' +
              '<% if (avatar) { %><img class="th right avatar" src="{{avatar}}"><% } %>' + 
              '<h5>About {{author}}</h5>' +
              '<p>{{{bio}}}' +
            '</div>' +
            '<div class="columns">' +
              '<p><span class="secondary label {{level}}"> {{level}}</span> ' +
                '{{{concatTags(tags, "radius")}}} ' +
                '{{{concatTags(languages, "secondary round")}}} ' +
                '<span class="nowrap">{{slotType}}</span> ' +
              '<div>' +
                '<a class="preview-action added-to-favorites"><span class="icon-star"></span> Added to favorites</a> ' +
                '<a class="preview-action add-to-favorites"><span class="icon-star-empty"></span> Add to favorites</a> ' +
                '<a class="preview-action tweet" target="_blank"><span class="icon-heart-empty"></span> Share my favorites</a> ' +
              '</div>' +
              '<div>' +
                '<span class="preview-action icon-recommended"><span class="icon-heart"></span> Recommended by friends</span> ' +
                '<a class="icon-recommended clear-recommendations" href="agenda.html">&raquo; clear recommendations</a> ' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</td></tr>', _.extend({
          colspan: $tr.children('td').length - 1,
          clazz: 
            (recommended.indexOf(talk.id) > -1? 'recommended ' : ' ') + 
            (favorites.indexOf(talk.id) > -1? 'favorited ' : ' '),
          talkId: talk.id
        }, talk), imports));

      // "appear" effect
      _.defer(function() { $('.zoomed').removeClass('zoomed'); });

      updateHash(talk.id);
    }

  })

  // click on add/remove favorite
  // this method should work when clicked inside a .preview or .agenda-cell
  $(document).on('click', '.add-to-favorites, .added-to-favorites', function(e) {
    var $a = $(e.currentTarget)
    , id = $a.closest('.agenda-cell').find('[data-talk-id]').data('talk-id') || $('.talk-active [data-talk-id]').data('talk-id')
    
    if ($a.hasClass('added-to-favorites')) {
      favorites = _.without(favorites, id)
    } else {
      favorites.push(id)
    }

    $('.preview[data-talk-id="' + id + '"], .agenda-cell[data-talk-id="' + id + '"]').toggleClass('favorited')

    if (window.localStorage) {
      window.localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  })
  .on('click', '.tweet', function(e) {
    var $a = $(e.currentTarget)
    $a.attr('href', 'https://twitter.com/home?status=My+selection+of+talks+at+@codemotion_es:+' + location.origin + location.pathname + '?recommended=' + encodeURIComponent(favorites))
  })

  // select the day or talk that comes with the hash, or day1 if empty
  if (location.href.indexOf('agenda') !== -1) {
    var parts = /(#day[12])(\/.+)?/.exec(location.hash || '')
    , hash = parts && parts[1] || '#day1'

    // disregard previously existing tabs
    $('.tab-title.active').removeClass('active')
    $('.tabs-content > .active').empty().removeClass('active')

    $('a[href="' + hash + '"]').closest('.tab-title').addClass('active');
    $('#' + hash.substring(1)).addClass('active');

    // select the talk, if any
    if (parts && parts[2]) {
      var retries = 0;
      var f = function() {
        var $talk = $('.talk-a[data-talk-id="' + parts[2].substring(1) + '"]');
        if ($talk.length) {
          $talk.click()
          $( "html, body" ).animate({
            // scroll to end of page
            scrollTop: $talk.offset().top - 200
          }, 1000);
        } else {
          if (retries++ < 1000) {
            requestAnimationFrame(f);
          } else {
            console.error("Cannot find selected talk " + parts[2]);
          }
        }
      };
      _.delay(f, 300);
    }
  }

  // testing 
  window.__sc = scrollTo;

})()