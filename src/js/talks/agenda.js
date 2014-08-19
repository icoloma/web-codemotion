(function() {

  'use strict';

  var talks = require('./data.js')
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
      { time: '14:00', endTime: '15:00', value: 'LUNCH' },
      { time: '15:00', endTime: '15:45' },
      { time: '16:00', endTime: '16:45' },
      { time: '17:00', endTime: '17:45' },
      { time: '18:00', endTime: '20:00', value: 'NETWORKING BEER' }
    ]
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
    , renderScheduleTable = function(schedule, tracks) {
      return _.template(
          '<table class="agenda-table"><thead><tr>' + 
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
                      '<span><a class="talk-a" data-talk-key="{{ schedule.talks[track].key }}">{{schedule.talks[track].title}}</a></span><br>' +
                      '<span>{{schedule.talks[track].author}}</span>' +
                    '<% } %>' +
                    '</td>' +
                  '<% }); %>' +
                '<% } %>' +
              '</tr>' +
            '<% }); %>' +
          '</tbody></table>', {
          colspan: tracks.length,
          schedules: schedules,
          tracks: tracks
        });
    }
    , views = {
      asList: function(talksCollection) {
        return _.template('<div class="columns"><ul class="unstyled small-block-grid-1 medium-block-grid-2">' +
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
          '<h1>Talks</h1>' + renderScheduleTable(schedules, ['Track 1','Track 2','Track 3','Track 4','Track 5','Track 6','Track 7','Track 8']) +
          '<h2>Workshops</h2>' + renderScheduleTable(schedules, ['Track A','Track B']) +
          '</div>'
      }
    }
    , render = function() {
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
  })

})()