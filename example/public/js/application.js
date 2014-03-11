var app = angular.module('app', ['ngRoute', 'ngCookies']);

app.config(function($routeProvider) {

    $routeProvider.when('/login', {
        templateUrl: 'html/login.html',
        controller: 'loginController'
    });

    $routeProvider.when('/edit', {
        templateUrl: 'html/editor.html'
    });

    $routeProvider.otherwise({
        redirectTo: '/login'
    });
});


app.controller('loginController', function($scope, $location, authenticationFactory) {

    $scope.credentials = {
        username: '',
        password: ''
    };

    $scope.login = function() {
        authenticationFactory.login($scope.credentials);
    }
});

app.factory('authenticationFactory', function($http, $location, $cookies) {

    return {
        login: function(credentials) {

            $http.post('/api/login.json', credentials).success(function(server) {

                if (server.status == 'okay') {
                    $cookies.__user = server.cookie;
                    $location.path('/edit');
                    return;
                }
            });
        },

        logout: function() {
            $http.get('/api/logout.json');
            $location.path('/login');
            delete $cookies.__user
        },

        isLoggedIn: function() {
            return $cookies.__user;
        }
    };
});