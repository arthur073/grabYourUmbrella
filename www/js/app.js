// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ionic.service.core', 'ionic.service.analytics', 'ionic-material', 'ionic-timepicker', 'chart.js', 'ngCordova'])

.run(function($ionicPlatform, $rootScope, $ionicAnalytics, $timeout) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    $ionicAnalytics.register();


    window.plugin.notification.local.onTrigger = function(id, state, json) {
      var notification = {
        id: id,
        state: state,
        json: json
      };
      $timeout(function() {
        $rootScope.$broadcast("$cordovaLocalNotification:triggered", notification);
      });
    };
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('main', {
      url: '/',
      templateUrl: 'templates/main.html',
      controller: 'MainCtrl'
    })
    .state('intro', {
      url: '/intro',
      templateUrl: 'templates/intro.html',
      controller: 'IntroCtrl'
    });

  $urlRouterProvider.otherwise("/");

})



.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate, $http, $cordovaLocalNotification) {

  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };

  var onSuccess = function(position) {
    alert("good!");
  };

  var onError = function(error) {
    alert("error");
  };

  $scope.retrieveCities = function() {
    // Hide button and show spinner
    document.querySelector("#retrieveCities_button").style.display = "none";
    document.querySelector("#retrieveCities_spinner").style.display = "inline";


    // Get GPS position
    navigator.geolocation.getCurrentPosition(onGetCurrentPositionSuccess, onError);

    setTimeout(function() {
      // Go to next slide
      $scope.next();

      // Show button and hide spinner
      document.querySelector("#retrieveCities_button").style.display = "inline";
      document.querySelector("#retrieveCities_spinner").style.display = "none";
    }, 3000);


  }

  var onGetCurrentPositionSuccess = function(position) {
    console.log("lat: " + position.coords.latitude);
    console.log("long: " + position.coords.longitude);
    var lat = parseFloat(position.coords.latitude);
    var lng = parseFloat(position.coords.longitude);

    // Persiting lat and long
    window.localStorage.setItem("lat", lat);
    window.localStorage.setItem("lng", lng);

    // Getting city name and country
    $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        lat + ',' + lng + '&key=AIzaSyDbPXnZc9TrDTWcjBGuni6HRfHV9JLjPco')
      .then(function(coord_results) {
          var arrAddress = coord_results.data.results[0].address_components;
          for (var i = 0; i < arrAddress.length; i++) {
            if (arrAddress[i].types[0] == "locality") {
              console.log(arrAddress[i].long_name); // city

              // Persisting local city name
              window.localStorage.setItem("city", arrAddress[i].long_name);
              $scope.city = window.localStorage.getItem("city");
            }
            if (arrAddress[i].types[0] == "country") {
              console.log(arrAddress[i].long_name); // country
              // Persisting local country name
              window.localStorage.setItem("country", arrAddress[i].long_name);
              $scope.country = window.localStorage.getItem("country");
            }
          }
        },
        function error(error) {
          console.log(error);
        });
  }



  $scope.timePickerObject = {
    inputEpochTime: ((new Date("January 1, 2016 09:00:00")).getHours() * 60 * 60), //Optional
    step: 5, //Optional
    format: 24, //Optional
    titleLabel: 'Notification time', //Optional
    setLabel: 'Set', //Optional
    closeLabel: 'Close', //Optional
    setButtonType: 'button-assertive', //Optional
    closeButtonType: 'button-stable', //Optional
    callback: function(val) { //Mandatory
      timePickerCallback(val);
    }
  };

  var timePickerCallback = function(val) {
    if (typeof(val) === 'undefined') {
      console.log('Time not selected');
    }
    else {
      console.log(val);
      var selectedTime = new Date(val * 1000);
      window.localStorage.setItem("notification_hours", (selectedTime.getUTCHours() < 10 ? '0' : '') + selectedTime.getUTCHours());
      window.localStorage.setItem("notification_minutes", (selectedTime.getUTCMinutes() < 10 ? '0' : '') + selectedTime.getUTCMinutes());
      console.log("selected time : " + selectedTime.getHours() + ":" + selectedTime.getMinutes());
      $scope.time = window.localStorage.getItem("notification_hours") + ":" + window.localStorage.getItem("notification_minutes");
      $scope.next();
    }
  };


  $scope.syncData = function() {
    // Hide button and show spinner
    document.querySelector("#syncdata_button").style.display = "none";
    document.querySelector("#syncdata_spinner").style.display = "inline";

    // Schedule notification at the right time
    var alarmTime = new Date();
    alarmTime.setMinutes(alarmTime.getMinutes() + 1);
    $cordovaLocalNotification.add({
      id: "1234",
      date: alarmTime,
      message: "This is a message",
      title: "This is a title",
      autoCancel: true,
      sound: null
    }).then(function() {
      console.log("The notification has been set");
    });


    setTimeout(function() {
      // And go to main screen
      $state.go('main');

      // Hide button and show spinner
      document.querySelector("#syncdata_button").style.display = "inline";
      document.querySelector("#syncdata_spinner").style.display = "none";
    }, 3000);
  };

})

.controller('MainCtrl', function($scope, $state, $ionicActionSheet, $timeout, $ionicSlideBoxDelegate) {

  $scope.city = window.localStorage.getItem("city");
  $scope.country = window.localStorage.getItem("country");

  if ($scope.city == null || $scope.country == null) {
    $state.go('intro');
  }

  $scope.graph = {}; // Empty graph object to hold the details for this graph

  $scope.graph.options = {
    showTooltips: false,
    scaleFontColor: "rgba(255,255,255,.5)",
    scaleGridLineColor: "rgba(255,255,255,.1)",
    scaleLineColor: "rgba(255,255,255,.1)",
    scaleOverride: true,
    scaleSteps: 10,
    scaleStepWidth: .1,
    scaleStartValue: 0,
    responsive: false
  };
  $scope.graph.colours = [{
    fillColor: "#FFF",
    scaleFontColor: "FFF"
  }];

  $scope.doRefresh = function() {
    // Display spinner and hide graph
    if (document.querySelector("#retrieveWeather_spinner") != null) {
      document.querySelector("#retrieveWeather_spinner").style.display = "inline";
    }
    if (document.querySelector("#weather_forecast") != null) {
      document.querySelector("#weather_forecast").style.display = "none";
    }

    // Do data refresh
    getWeatherForecast();

    // Stop the ion-refresher from spinning
    $scope.$broadcast('scroll.refreshComplete');
  };


  var getWeatherForecast = function() {

    // Launch request
    var request = new XMLHttpRequest();
    var lat = window.localStorage.getItem("lat");
    var lng = window.localStorage.getItem("lng");
    var url = "http://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lng + "&8c85f80e77976a81f16bdeaec7dd695a&units=metric";
    request.open("GET", url, true);


    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        if (request.status == 200 || request.status == 0) {

          var forecastArray = JSON.parse(request.responseText).list;

          $scope.conditions = forecastArray[0].weather[0].main;
          $scope.temperature = forecastArray[0].main.temp;
          $scope.humidity = forecastArray[0].main.humidity;

          $scope.graph.data = [
            []
          ];
          $scope.graph.labels = []; // Add labels for the X-axis
          $scope.graph.series = ['rain']; // Add information for the hover/touch effect 

          for (var i = 0; i < 6; i++) {
            var label = forecastArray[i].dt_txt.split(" ")[1].slice(0, -3);
            $scope.graph.labels.push(label);

            if (forecastArray[i].rain != undefined && forecastArray[i].rain['3h'] != undefined) {
              // Rain :)
              var rainQuantity = forecastArray[i].rain['3h'];

              if (rainQuantity > 1) {
                rainQuantity = 1;
              }
              $scope.graph.data[0].push(rainQuantity);
            }
            else {
              // No rain
              $scope.graph.data[0].push(0);
            }
          }

          // Hide spinner and display graph
          if (document.querySelector("#retrieveWeather_spinner") != null) {
            document.querySelector("#retrieveWeather_spinner").style.display = "none";
          }
          if (document.querySelector("#no_connection") != null) {
            document.querySelector("#no_connection").style.display = "none";
          }
          if (document.querySelector("#weather_forecast") != null) {
            document.querySelector("#weather_forecast").style.display = "block";
          }
        }
        else {
          // In case of error
          document.querySelector("#no_connection").style.display = "block";
        }
      }
    }
    request.send();
  };


  setTimeout(function() {
    $scope.doRefresh();
  }, 2000);


  $scope.settings = function() {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Reset settings',
      titleText: 'Settings',
      cancelText: 'Cancel',
      cancel: function() {},
      destructiveButtonClicked: function(index) {
        $state.go('intro');
      }
    });
  };
  
  
  $scope.$on("$cordovaLocalNotification:triggered", function(id, state, json) {
    alert("Added a notification");
  });
});