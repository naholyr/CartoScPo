import angular from 'angular'
import ngRoute from 'angular-route'

import appComponent from './components/app'

angular.module('bobib', [ngRoute, appComponent]).config([
  '$locationProvider',
  '$routeProvider',
  ($locationProvider, $routeProvider) => {
    $locationProvider.html5Mode(true)
    $routeProvider
      .when('/', {
        template: '<h1 class="title">Home</h1>',
      })
      .when('/centers', {
        template: '<centers />',
      })
      .when('/modifications', {
        template: '<h1 class="title">Modifications</h1>',
      })
      .when('/users', {
        template: '<h1 class="title">Users</h1>',
      })
      .otherwise('/')
  },
])