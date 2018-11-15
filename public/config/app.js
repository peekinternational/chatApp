/*
* author  => Muhammad sajid
* designBy => Muhammad sajid
*/
var dependencies = [
"ngRoute",
'ngAnimate',
'ngSanitize',
'ui.bootstrap',
'btorfs.multiselect'
]

var app = angular.module("chatApp", dependencies);
 
app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});