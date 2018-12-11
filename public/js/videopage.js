$('input[type="file"]').change(function(e){
        var fileName = e.target.files[0].name;
        $('.custom-file-label').html(fileName);
    });

$('#videoFile').on('change', function() {
    var file = this.files[0];
    if (file.size > 83886080) {
        alert("Max File Size 80MB!");
    }
});

//Maybe create config for server url
var serverUrl = document.location.origin;

$('#uploadForm').attr('action', serverUrl + '/video/upload');
$('#eventForm').attr('action', serverUrl + '/events');

$('#eventForm').on('submit', function(e){
    e.preventDefault();
    $.ajax({
        url : $(this).attr('action'),
        type: "POST",
        data: $(this).serialize(),
        success: function (data) {
            if($("#eventAlertFail").is(':visible')) $("#eventAlertFail").hide();
            $("#eventAlertSuccess").show();
        },
        error: function (jXHR, textStatus, errorThrown) {
            if($("#eventAlertSuccess").is(':visible')) $("#eventAlertSuccess").hide();
            $("#eventAlertFail").html(jXHR.responseJSON.message).show();
        }
    });
});

$('#uploadForm').on('submit', function(e){
    e.preventDefault();
    var formData = new FormData($(this)[0]);

    $.ajax({
        url : $(this).attr('action'),
        type: "POST",
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            if($("#videoAlertFail").is(':visible')) $("#videoAlertFail").hide();
            $("#videoAlertSuccess").show();
            $("#videoProgress").hide();
        },
        error: function (jXHR, textStatus, errorThrown) {
            if($("#videoAlertSuccess").is(':visible')) $("#videoAlertSuccess").hide();
            $("#videoAlertFail").html(jXHR.responseJSON.message).show();
            $("#videoProgress").hide();
        },
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload) {
                // For handling the progress of the upload
                myXhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        $("#videoProgress").show();

                        var progress = Math.ceil(e.loaded/e.total)*100;
                        $("#videoProgress .progress-bar-striped").width(progress+'%');
                        $("#videoAlertSuccess").hide();
                        $("#videoAlertFail").hide();
                    }
                } , false);
            }
            return myXhr;
        }
    });
});

var eventsList = function(){
    var events = [];
    
    this.getEventsList = function(){
        return $.ajax({
            url: serverUrl + '/events',
            dataType: 'json',
            success: function(result){
                events = result.events;
                createEventsList();
                createUploadEvents();
            }
        })
    }

    //Getter but unused
    this.getEvents = function(){
        return events;
    }

    function createEventsList() {
        var list = $("#eventsList .list-group");
        list.children().remove();
        
        events.forEach(function(event) {
            var button = '<button type="button" class="list-group-item list-group-item-action">' + event + '</button>';
            list.append(button);
        });
        //Setting click function
        list.children().each(function(){
            $(this).click(function(){
                videos.getEventVideos($(this).text())//Could probably do this line better
            });
        });
    }

    function createUploadEvents() {
        var options = $("#uploadEvents");
        options.children().remove();
        events.forEach(function(event){
            var selection = '<option>' + event + '</option>';
            options.append(selection);
        });
    }
}

var eventsContent = function(){
    var eventVideos = [];
    var currEvent = null;
    
    this.getEventVideos = function(event){
        return $.ajax({
            url: serverUrl + '/events/' + event + '/videos',
            dataType: 'json',
            success: function(result){
                eventVideos = result.videoNames;
                currEvent = event;
                createVideosContent();
            }
        })
    }

    //Getters but unused
    this.getVideos = function(){
        return eventVideos;
    }

    //Getters but unused
    this.getEvent = function() {
        return currEvent;
    }

    function createVideosContent() {
        var container = $("#container");
        var counter = 0;
        var row = '<div class="row">'
        
        container.children().remove();
        eventVideos.forEach(function(video){
            row += '<div class="col-md-4">' +
                        '<div class="videoBox">' +
                            '<video controls>' +
                                '<source src="' + serverUrl + '/video/' + currEvent + '/' + video +'" type="video/mp4">' +
                            '</video>' +
                        '</div>' +
                    '</div>';
            counter++;
            if(counter % 3 == 0) {
                row+= '</div>';
                container.append(row);
                row = '<div class="row">';
            }
        });
        if(counter % 3 != 0){row += '</div>'; container.append(row);}
    }
}

var events = new eventsList();
var videos = new eventsContent();

events.getEventsList().then(function(){
    //createEventsList(events.getEvents());
});