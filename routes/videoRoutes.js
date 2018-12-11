const fs           = require('fs');
const {join}         = require('path');

//Helper functions, not too many, won't make a new file or folder for them
const isDirectory = source => fs.lstatSync(source).isDirectory()

const getDirectories = source => {
  var dirs = fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory);
  dirs.forEach(function(name, index){
    dirs[index] = dirs[index].replace(source, '');
  });
  return dirs;
}

const getVids = source => {
  if(!fs.existsSync(source)) throw "Directory/Event Does Not Exist";
  return fs.readdirSync(source);
}

module.exports = function(app, videoDir) {
    //Retrieves all events
    app.get('/events', function(req, res){
        var dirs = getDirectories(videoDir);
        return res.json({events: dirs});
    });

    //Create a new event
    app.post('/events', function(req, res){
      var newEvent = videoDir + req.body.name;
      if (!fs.existsSync(newEvent)){
        fs.mkdir(newEvent, function(err) {
          if(err) return res.status(500).json({ message: "Error Creating Event"});
          return res.status(200).json({ message: "Event Created"});
        });
      } else {
        return res.status(409).json({ message: "Event Already Exists"});
      }
    });

    //get all names of the videos for an event
    app.get('/events/:name/videos', function(req, res){
        var event = req.params.name;
        if(!event) return res.status(400).json({ message: "No event name"});//Not sure if this check is necessary

        try {
          var fileNames = getVids(videoDir+event);
          return res.json({videoNames: fileNames});
        } catch(e) {
          return res.status(404).json({ message: e});
        }
    });

    //Retrieve video given an event and file name
    app.get('/video/:event/:name', function(req, res){     
        try {
          var path = videoDir + req.params.event + '/' + req.params.name;
          var stat = fs.statSync(path);
          var fileSize = stat.size;
          var range = req.headers.range;
        } catch(e) {
          return res.status(500).json({ message: "Error Retriving Video"});
        }

        if (range) {
          let parts = range.replace(/bytes=/, "").split("-");
          let start = parseInt(parts[0], 10);
          let end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
          let chunksize = (end-start)+1;
          let file = fs.createReadStream(path, {start, end});
          let head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          }
          res.writeHead(206, head);
          file.pipe(res);
        } else {
          let head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(200, head);
          fs.createReadStream(path).pipe(res);
        }
    });

    //Upload a video
    app.post('/video/upload', function(req, res) {
      if (!req.files || Object.keys(req.files).length == 0) {
        return res.status(400).json({ message: "No files were uploaded"});
      }

      var video = req.files.uploadVid;
      var vidDir = videoDir + req.body.event + '/' + video.name;
      // Use the mv() method to place the file somewhere on your server
      video.mv(vidDir, function(err) {
        if(err) return res.status(500).json({ message: "Error Uploading Video"});

        return res.status(200).json({ message: "Video Upload Success"});
      });
    });
};