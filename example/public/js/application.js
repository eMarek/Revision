var app = angular.module("app", ["ngRoute"]);

/* app config
-------------------------------------------------- */
app.config(function($routeProvider) {

    $routeProvider.when("/login", {
        "templateUrl": "html/login.html",
        "controller": "loginController"
    });

    $routeProvider.when("/edit", {
        "templateUrl": "html/editor.html",
        "controller": "editorController"
    });

    $routeProvider.otherwise({
        "redirectTo": "/login"
    });
});

app.config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});

/* app run
-------------------------------------------------- */
app.run(function($rootScope, $window, $location) {

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if ($location.path() != '/login' && !$window.sessionStorage.session) {
            $location.path('/login');
        } else if ($location.path() == '/login' && $window.sessionStorage.session) {
            delete $window.sessionStorage.session;
        }
    });
});

/* app factory auth interceptor
-------------------------------------------------- */
app.factory('authInterceptor', function($rootScope, $q, $window, $location) {
    return {
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.session) {
                config.headers.Authorization = $window.sessionStorage.session;
            }
            return config;
        },
        response: function(response) {
            var rsp = response.data;
            if (rsp.say == "out") {
                $location.path("/login");
            }
            return response || $q.when(response);
        }
    };
});

/* app controller login
-------------------------------------------------- */
app.controller("loginController", function($scope, $location, authenticationFactory) {

    $scope.credentials = {
        "username": "",
        "password": ""
    };

    $scope.login = function() {
        authenticationFactory.login($scope.credentials);
    }
});

/* app factory authentication
-------------------------------------------------- */
app.factory("authenticationFactory", function($http, $location, $window) {

    return {
        login: function(credentials) {

            $http.post("/api/login.json", credentials).success(function(rsp) {

                if (rsp.say == "yay") {
                    $window.sessionStorage.session = rsp.session;
                    $location.path("/edit");
                    return;
                } else {
                    delete $window.sessionStorage.session;
                }
            });
        },

        logout: function() {
            $http.get("/api/logout.json");
            $location.path("/login");
        }
    };
});

/* app controller login
-------------------------------------------------- */
app.controller("editorController", function($scope, $http, $location) {

    $scope.users = function() {
        $http.post("/api/other/users.json").success(function(rsp) {

        });
    }

    $scope.logout = function() {
        $location.path("/login");
    }
});