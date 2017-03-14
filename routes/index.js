var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

var Club = mongoose.model('Club');
var Event = mongoose.model('Event');
var User = mongoose.model('User');

router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)

    user.save(function (err){
        if(err){ return next(err); }

        return res.json({token: user.generateJWT()})
    });
});

router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info){
        if(err){ return next(err); }

        if(user){

            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.get('/clubs', function (req, res, next) {

  Club.find(function (err, clubs) {

    if (err) { next(err); }

    res.json(clubs);

  });

});

router.post('/clubs', auth, function (req, res, next) {

  var club = new Club(req.body);

  club.owner = req.payload.username;

  club.save(function (err, club) {

    if (err) { return next(err); }

    res.json(club);

  });

});

router.param('club', function (req, res, next, id) {

    var query = Club.findById(id);

    query.exec(function (err, club) {

        if (err) { return next(err); }
        if (!club) { return next(new Error('Club not found')); }

        req.club = club;
        return next();

    });

});

router.param('event', function (req, res, next, id) {

    var query = Event.findById(id);

    query.exec(function (err, event) {

        if (err) { return next(err); }
        if (!event) { return next(new Error('Event not found')); }

        req.event = event;
        return next();

    });

});

router.get('/clubs/:club/', function (req, res) {

    req.club.populate('events', function (err, club) {

        if(err) { return next(err); }

        res.json(club);

    });

});

router.post('/clubs/:club/events', auth, function (req, res, next) {

    var event = new Event(req.body);

    event.club = req.club;
    event.creator = req.payload.username;

    event.save(function (err, event) {

        if (err) { return next(err); }

        req.club.events.push(event);
        req.club.save(function (err, club) {

            if(err) { return next(err); }

            res.json(event);

        });

    });

});

module.exports = router;
