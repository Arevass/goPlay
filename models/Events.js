var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({

    name: String,
    desc: String,
    creator: String,
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }

});

mongoose.model('Event', EventSchema);