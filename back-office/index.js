import angular from 'angular'
import ngRoute from 'angular-route'

import appComponent from './components/app'
import filters from './filters'
import session from './services/session'
import commonmark from './services/commonmark'

// redirect to home if not authorized
const checkAuth = {
  checkAuth: [
    '$location',
    '$q',
    'session',
    ($location, $q, session) => {
      if (session.email) return $q.resolve()
      $location.path('/')
      return $q.reject()
    },
  ],
}

angular
  .module('bobib', [ngRoute, appComponent, filters, session, commonmark])
  .config([
    '$locationProvider',
    '$routeProvider',
    ($locationProvider, $routeProvider) => {
      $locationProvider.html5Mode(true)
      $routeProvider
        .when('/', {
          template:
            '<h1 class="title">Home</h1><p><a href="http://cartosciencepolitique.sciencespo.fr">Front Office</a></p>',
        })
        .when('/centers/add', {
          template: '<center-form />',
        })
        .when('/centers/:id/:tab?', {
          template: '<center-form id="$resolve.id" tab="$resolve.tab" />',
          resolve: {
            id: [
              '$q',
              '$route',
              ($q, { current }) => $q.resolve(current.params.id),
            ],
            tab: [
              '$q',
              '$route',
              ($q, { current }) => $q.resolve(current.params.tab),
            ],
          },
        })
        .when('/centers', {
          template: '<centers-list />',
        })
        .when('/modifications', {
          template: '<modifications-list />',
          resolve: checkAuth,
        })
        .when('/users/add', {
          template: '<user-form />',
          resolve: checkAuth,
        })
        .when('/users', {
          template: '<users-list />',
          resolve: checkAuth,
        })
        .when('/login', {
          template: '<login-form />',
        })
        .otherwise('/')
    },
  ])
  .run([
    '$route',
    '$rootScope',
    '$location',
    ($route, $rootScope, $location) => {
      const original = $location.path
      $location.path = (path, reload) => {
        // for tabs
        if (reload === false) {
          const lastRoute = $route.current
          const un = $rootScope.$on('$locationChangeSuccess', () => {
            $route.current = lastRoute
            un()
          })
        }
        return original.call($location, path)
      }
    },
  ])
