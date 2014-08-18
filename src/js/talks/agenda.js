(function() {

  'use strict';

/*
Talk format: "author", "title", "tags"[],"language","languages"[],"date","time","slotType","description","communities","avatar","level","track"
*/
  
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
      { time: '08:00', endTime: '09:00' },
      { time: '09:00', endTime: '09:45' },
      { time: '09:45', endTime: '10:30' },
      { time: '10:45', endTime: '11:30' },
      { time: '11:30', endTime: '12:15', value: 'COFEE BREAK' },
      { time: '12:15', endTime: '13:00' },
      { time: '13:15', endTime: '14:00' },
      { time: '14:00', endTime: '15:00', value: 'LUNCH' },
      { time: '15:00', endTime: '15:45' },
      { time: '16:00', endTime: '16:45' },
      { time: '17:00', endTime: '17:45' },
      { time: '18:00', endTime: '20:00', value: 'Networking beer' }
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
    , views = {
      asList: function(talksCollection) {
        return _.template('<ul class="unstyled small-block-grid-1 medium-block-grid-2">' +
          '<% _.forEach(talks, function(talk) { %>' +
            '<li>' +
              '<article class="talk">' +
              '<% if (talk.avatar) { %>' +
                '<img class="th toright avatar" src="{{talk.avatar}}">' +
              '<% } %>' + 
              '<h1>{{talk.title}}</h1>' +
              '<p>{{{talk.description}}}' +
                '<br><small>' +
                  'Author: {{talk.author}}' +
                  '<br>' +
                    '<span class="secondary label {{talk.level}}"> {{talk.level}}</span> ' +
                    '{{{concatTags(talk.tags, "radius")}}} ' +
                    '{{{concatTags(talk.languages, "secondary round")}}} ' +
                  '<br>{{talk.time}} {{talk.track}}' +
                '</small>' +
              '</p>' +
              '</article>' +
            '</li>' +
          '<% }); %>' +
        '</ul>', { 
          talks: talksCollection
        }, imports);
      }
      , asGrid: function(talksCollection) {
        var tracks = ['Track 1','Track 2','Track 3','Track 4','Track 5','Track 6','Track 7','Track 8'];
        schedules = _.map(schedules, function(schedule) {
          var talks = _.filter(talksCollection, function(talk) {
            return schedule.time === talk.time;
          });
          schedule.talks = _.indexBy(talks, 'track');
          return schedule;
        });
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
                  '<td colspan="8" class="text-center break">{{schedule.value}}</td>' +
                '<% } else { %>' +
                  '<% _.forEach(tracks, function(track, index) { %>' +
                    '<td class="text-center">' +
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
          schedules: schedules,
          tracks: tracks
        });
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
        $container.html('<div class="panel callout radius">No results found</div>');
      }
    }
  ;

  _.templateSettings.interpolate = /\{\{\{([^}]+?)\}\}\}/g;
  _.templateSettings.escape = /\{\{([^\{][^}]+?)\}\}/g;
  talks = _.sortBy(talks, ['date', 'title']);

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
    $(e.currentTarget).closest('tr').after(_.template(
      '<tr class="preview"><td></td><td colspan="8">' +
        '<div class="small-6 columns">' +
          '<h5>{{title}} <small>by {{author}}</small></h5>' +
          '<p>{{{description}}}</p>' +
          '<span class="secondary label {{level}}"> {{level}}</span> ' +
          '{{{concatTags(tags, "radius")}}} ' +
          '{{{concatTags(languages, "secondary round")}}} ' +
          ' {{slotType}} ' +
        '</div>' +
        '<div class="small-6 columns">' +
          '<% if (avatar) { %><img class="th right avatar" src="{{avatar}}"><% } %>' + 
          '<h5>About {{author}}</h5>' +
          '{{bio}}' +
        '</div>' +
      '</td></tr>', talk, imports));
  })

})()