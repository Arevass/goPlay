var app = angular.module('goPlay', ['ui.router', 'ui.bootstrap']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    clubPromise: ['clubs', function (clubs) {
                        return clubs.getAll();
                    }]
                }
            })
            .state('clubs', {
                url: '/clubs/{id}',
                templateUrl: '/clubs.html',
                controller: 'ClubsCtrl',
                resolve: {
                    club: ['$stateParams', 'clubs', function ($stateParams, clubs) {
                        return clubs.get($stateParams.id);
                    }]
                }
            })
            .state('users', {
                url: '/users/{id}',
                templateUrl: '/users.html',
                controller: 'UserCtrl',
                resolve: {
                    user: ['$stateParams', 'users', function ($stateParams, users) {
                        return users.get($stateParams.id)
                    }]
                }
            })
            .state('events', {
                url: '/clubs/{id}/events/{eid}',
                templateUrl: '/events.html',
                controller: 'EventCtrl',
                resolve: {
                    event: ['$stateParams', 'clubs', function ($stateParams, clubs) {
                        return clubs.getEvent($stateParams.id, $stateParams.eid);
                    }],
                    club: ['$stateParams', 'clubs', function ($stateParams, clubs) {
                        return clubs.get($stateParams.id);
                    }]
                }

            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home')
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home')
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }
]);

app.factory('users', [
    '$state',
    '$http',
    '$log',
    'auth',
    function ($state, $http, $log, auth) {

        var o = {
            users: []
        };

        o.getAll = function () {
            return $http.get('/users').success(function (data) {
                angular.copy(data, o.users);
            });
        };

        o.get = function (id) {
            $log.info('users.get called');
            return $http.get('/users/' + id).then(function (res) {
                return res.data;
            });
        };

        return o;

    }
]);

app.factory('events', [
    '$state',
    '$http',
    '$log',
    'auth',
    function ($state, $http, $log, auth) {

        var o = {
            events: []
        };

        o.getAll = function () {
            return $http.get('/events').success(function (data) {
                angular.copy(data, o.events);
            });
        };

        o.get = function (id) {
            return $http.get('/events/' + id).then(function (res) {
                return res.data;
            });
        };

        o.delete = function (id) {
            return $http.delete('/events/' + id, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                $state.go('home');
            })
        };

        o.buyTicket = function (id, user) {
            return $http.post('/events/' + id + '/tickets/' + user + '/join', {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        return o;

    }
]);

app.factory('clubs', [
    '$state',
    '$http',
    '$log',
    'auth',
    function ($state, $http, $log, auth) {

        var o = {
            clubs: []
        };

        o.getAll = function () {
            return $http.get('/clubs').success(function (data) {
                angular.copy(data, o.clubs);
            });
        };

        o.get = function (id) {
            return $http.get('/clubs/' + id).then(function (res) {
                return res.data;
            });
        };

        o.getEvent = function (id, eid) {
            return $http.get('/clubs/' + id + '/events/' + eid).then(function (res) {
                return res.data;
            })
        };

        o.create = function (club) {
            return $http.post('/clubs', club, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                o.clubs.push(data);
            })
        };

        o.delete = function (id) {
            return $http.delete('/clubs/' + id, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).success(function (data) {
                $log.info(data);
                $state.go('home');
            })
        };
        
        o.addEvent = function (id, event) {
            return $http.post('/clubs/' + id + '/events', event, {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        o.addMember = function (id, member) {
            return $http.post('/clubs/' + id + '/members/' + member + '/join', {
                headers: { Authorization: 'Bearer ' + auth.getToken()}
            });
        };

        o.sendMail = function (email) {
            $log.info('Sending mail 2');
            return $http.post('/email', email).then(function (res) {
                $log.info('Email sent!');
            })
        };

        return o;

}]);

app.factory('auth', [
    '$http',
    '$log',
    '$window',
    function ($http, $log, $window) {

        var auth = {};

        auth.saveToken = function (token) {
            $window.localStorage['goplay-token'] = token;
        };

        auth.getToken = function () {
            return $window.localStorage['goplay-token'];
        };

        auth.isLoggedIn = function () {

            var token = auth.getToken();

            if (token) {
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        auth.currentUser = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                //Payload is the user object
                //$log.info(payload);

                return payload.username;

            }
        };

        auth.currentUserId = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                $log.info('Returning user id');
                $log.info(payload._id);

                return payload._id;

            }
        };

        auth.currentUserObject = function () {

            if (auth.isLoggedIn()) {

                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload;

            }
        };

        auth.register = function (user) {

            return $http.post('/register', user).success(function (data) {
                auth.saveToken(data.token);
            });

        };

        auth.logIn = function (user) {

            return $http.post('/login', user).success(function (data) {
                auth.saveToken(data.token);
            });

        };

        auth.logOut = function () {
            $window.localStorage.removeItem('goplay-token');
        };

        return auth;

    }
]);

app.controller('MainCtrl', [
    '$scope',
    '$uibModal',
    '$log',
    'clubs',
    'auth',
    function ($scope, $uibModal, $log, clubs, auth) {

        $scope.animationsEnabled = true;

        $scope.clubModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/clubForm.html',
                controller: 'MainCtrl',
                size: size
            });

            modalInstance.result.then(function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.clubs = clubs.clubs;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.createClub = function () {

            if($scope.name == '' ||
                $scope.desc == '' ||
                $scope.pubKey == '' ||
                $scope.regFee == '') { return; }

            clubs.create({
                name: $scope.name,
                desc: $scope.desc,
                pubKey: $scope.pubKey,
                regFee: $scope.regFee
            });

            $scope.name = '';
            $scope.desc = '';
            $scope.pubKey = '';
            $scope.regFee = '';
        };
    }
]);

app.controller('ClubsCtrl', [
    '$scope',
    '$uibModal',
    '$log',
    'clubs',
    'users',
    'club',
    'auth',
    function ($scope, $uibModal, $log, clubs, users, club, auth) {

        $log.info(club);

        var tpl, jsassets, tag, i, l;

        tpl = document.getElementById('/clubs.html');

        jsassets = (tpl.getAttribute('data-jsassets') || '').split(',');

        //Retrieve list of javascript assets and inject them into the page

        for( i = 0, l = jsassets.length; i < l; i++) {
            tag = document.createElement('script');
            tag.type = "text/javascript";
            tag.src = jsassets[i];
            document.head.appendChild(tag);
        }

        $scope.club = club;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.animationsEnabled = true;

        for (var e = 0; e < club.members.length; e++) {

            (function (e) {

                users.get(club.members[e]).then(function (user) {

                    $scope.club.members.splice(e, 1, user);

                })

            })(e);

        }

        var currentUser = auth.currentUserId();


        var recip = users.get(currentUser).then(function (user) {

            $log.info('email user :');
            $log.info(user.email);
            //$scope.recipient = user.email;
            return user.email;

        });

        $scope.message = 'You have joined ' + club.name;

        $scope.email = {

            recipient: recip,
            subject: 'Joined club!',
            message: $scope.message

        };

        $scope.addEvent = function(){

            if($scope.name === '') { return; }

            clubs.addEvent(club._id, {

                name: $scope.name,
                desc: $scope.desc,
                price: $scope.ticPrice,
                creator: 'user'

            }).success(function(event) {

                $scope.club.events.push(event);

            });

            $scope.name = '';
            $scope.desc = '';
            $scope.ticPrice = '';

        };

        $scope.addMember = function () {

            $log.info('addMember called');

            $scope.member = auth.currentUserId();

            $log.info('currentUserId Return in ClubsCtrl');
            $log.info($scope.member);

            clubs.addMember(club._id, $scope.member).success(function (member) {

                $scope.club.members.push(member);

            });

            $log.info('Sending mail');

            //clubs.sendMail($scope.email)

        };

        $scope.deleteClub = function () {

            $log.info('deleteClub called');
            $log.info(club._id);
            clubs.delete(club._id);

        };

        $scope.showToOwner = function () {

            return club.owner == auth.currentUser();

        };

        $scope.eventModal = function (size) {

            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/eventForm.html',
                controller: 'ClubsCtrl',
                resolve: {
                    club: ['$stateParams', 'clubs', function ($stateParams, clubs) {
                        return clubs.get($stateParams.id);
                    }]
                },
                size: size
            });

            modalInstance.result.then(function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };
    }
]);

app.controller('UserCtrl', [
    '$scope',
    '$http',
    '$log',
    'clubs',
    'users',
    'events',
    'user',
    'auth',
    function ($scope, $http, $log, clubs, users, events, user, auth) {

        //$log.info(user);

        $scope.user = user;

        // Loop through a user's clubs
        for (var i = 0; i < user.clubs.length; i++) {

            // For each club, loop through that club's events
            for (var j = 0; j < user.clubs[i].events.length; j++) {

                // JavaScript dude, god DAMN
                (function (i, j) {

                    events.get(user.clubs[i].events[j]).then(function (user) {

                        //Replace the event id in the array with the event object itself
                        $scope.user.clubs[i].events.splice(j, 1, user);

                    });

                })(i, j);

            }

        }

        // Do the same to retrieve and replace user's events
        for (var e = 0; e < user.events.length; e++) {

            (function (e) {

                events.get(user.events[e]).then(function (user) {

                    $scope.user.events.splice(e, 1, user);

                })

            })(e);

        }

    }
]);

app.controller('EventCtrl', [
    '$scope',
    '$log',
    'events',
    'event',
    'users',
    'club',
    'auth',
    function ($scope, $log, events, event, users, club, auth) {

        $log.info('EventCtrl Initialized');

        var tpl, jsassets, tag, i, l;

        tpl = document.getElementById('/clubs.html');

        jsassets = (tpl.getAttribute('data-jsassets') || '').split(',');

        //Retrieve list of javascript assets and inject them into the page

        for( i = 0, l = jsassets.length; i < l; i++) {
            tag = document.createElement('script');
            tag.type = "text/javascript";
            tag.src = jsassets[i];
            document.head.appendChild(tag);
        }

        $scope.event = event;
        $scope.club = club;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.name = event.name;

        for (var e = 0; e < event.tickets.length; e++) {

            (function (e) {

                users.get(event.tickets[e]).then(function (user) {

                    $scope.event.tickets.splice(e, 1, user);

                })

            })(e);

        }

        $scope.showToOwner = function () {

            return event.creator == auth.currentUser();

        };

        $scope.buyTicket = function () {

            $scope.user = auth.currentUserId();

            events.buyTicket(event._id, $scope.user).success(function (user) {

                $scope.event.tickets.push(user);

            })

        };

        $scope.deleteEvent = function () {

            events.delete(event._id);

        };
    }
]);

app.controller('PaymentCtrl', [
    '$scope',
    '$log',
    'auth',
    function ($scope, $log, auth) {

        $scope.makePayment = function () {
            $log.info("makePayment Called");
        };

        $scope.simplifyResponseHandler = function (data) {
            var $paymentForm = $("#simplify-payment-form");
            // Remove all previous errors
            $(".error").remove();
            // Check for errors
            if (data.error) {
                // Show any validation errors
                if (data.error.code == "validation") {
                    var fieldErrors = data.error.fieldErrors,
                        fieldErrorsLength = fieldErrors.length,
                        errorList = "";
                    for (var i = 0; i < fieldErrorsLength; i++) {
                        errorList += "<div class='error'>Field: '" + fieldErrors[i].field +
                            "' is invalid - " + fieldErrors[i].message + "</div>";
                    }
                    // Display the errors
                    $paymentForm.after(errorList);
                }
                // Re-enable the submit button
                $("#process-payment-btn").removeAttr("disabled");
            } else {
                // The token contains id, last4, and card type
                var token = data["id"];
                // Insert the token into the form so it gets submitted to the server
                $paymentForm.append("<input type='hidden' name='token' value='" + token + "' />");

                $paymentForm.append("<input type='hidden' name='amount' value='{{ club.regFee }}' />");
                // Submit the form to the server
                $paymentForm.get(0).submit();
            }
        };

        $(document).ready(function() {
            $("#simplify-payment-form").on("submit", function() {
                console.log('test');
                // Disable the submit button
                $("#process-payment-btn").attr("disabled", "disabled");
                // Generate a card token & handle the response
                SimplifyCommerce.generateToken({
                    key: "sbpb_MzI0ZmI0NWMtZTEwOS00NjBhLWJlMTUtN2JhZjEzNjQ4NThi",
                    card: {
                        number: $("#cc-number").val(),
                        cvc: $("#cc-cvc").val(),
                        expMonth: $("#cc-exp-month").val(),
                        expYear: $("#cc-exp-year").val()
                    }
                }, simplifyResponseHandler);
                // Prevent the form from submitting
                return false;
            });
        });
    }
]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {

        $scope.user = {};

        $scope.register = function(){
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };
    }
]);

app.controller('NavCtrl', [
    '$scope',
    'auth',
    function ($scope, auth) {

        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId();
        $scope.logOut = auth.logOut;

    }
]);

app.controller('ModalCtrl',
    function ($scope, $uibModal, $log) {

          $scope.animationsEnabled = true;

          $scope.open = function (size) {

            var modalInstance = $uibModal.open({
              animation: $scope.animationsEnabled,
              templateUrl: 'form.ejs',
              controller: 'ModalInstanceCtrl',
              size: size
           });

            modalInstance.result.then(function (selectedItem) {
              $scope.selected = selectedItem;
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });
          };

          $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
          };

});

app.controller('ModalInstanceCtrl',
    function ($scope, $uibModalInstance) {

        $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        };

});

app.controller('listCtrl',
    function ($scope) {

        $scope.clubsShow = true;
        $scope.socsShow = false;

        $scope.clubs = function () {
            if($scope.socsShow) {
                $scope.socsShow = false;
                $scope.clubsShow = true;
            }
        };

        $scope.socs = function () {
            if($scope.clubsShow) {
                $scope.clubsShow = false;
                $scope.socsShow = true;
            }
        };

});
