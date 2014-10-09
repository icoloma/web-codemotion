(function() {

  'use strict';

  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||  window.oRequestAnimationFrame || function(f) { _.delay(f, 1000/60) }
    , talks = require('./data.js')
    , _ = require('../vendor/lodash-2.4.1.min')
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
        history.pushState({}, document.title, 'agenda.html' + $('.tab-title.active > a').attr('href') + (talkId? '/' + talkId : ''));
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
                  '<% _.forEach(tracks, function(track, index) { %>' +
                    '<td class="text-center <% if (schedule.talks[track] && schedule.talks[track].slotType == "Workshop (2 hours)") { %>workshop<% } %>"> ' +
                    '<% if (schedule.talks[track]) { %>' +
                      '<span><a class="talk-a" data-talk-id="{{ schedule.talks[track].id }}" data-talk-key="{{ schedule.talks[track].key }}">{{schedule.talks[track].title}}</a></span><br>' +
                      '<span>{{schedule.talks[track].author}}</span>' +
                    '<% } %>' +
                    '</td>' +
                  '<% }); %>' +
                '<% } %>' +
              '</tr>' +
            '<% }); %>' +
          '</tbody></table>', {
          tableClass: tableClass,
          colspan: tracks.length,
          schedules: schedules,
          tracks: tracks
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
        '<tr class="preview"><td></td><td colspan="{{colspan}}">' +
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
            '</div>' +
          '</div>' +
        '</td></tr>', _.extend({
          colspan: $tr.children('td').length - 1
        }, talk), imports));

      // "appear" effect
      _.defer(function() { $('.zoomed').removeClass('zoomed'); });

      updateHash(talk.id);
    }

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