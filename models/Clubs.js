var mongoose = require('mongoose');

var ClubSchema = new mongoose.Schema({

    name: String,
    desc: String,
    owner: String,
    events: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}]

});

mongoose.model('Club', ClubSchema);